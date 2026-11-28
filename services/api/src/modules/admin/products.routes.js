import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import validate from '../../middlewares/validate.js';
import { uploadImages, publicUrl } from '../../middlewares/upload.js';
import { objectId, pageQuery, trimmedSearch } from '../../lib/schemas.js';
import { escapeRegex, paginate, slugify } from '../../lib/util.js';
import AppError from '../../lib/AppError.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { invalidate, CACHE_KEYS } from '../../lib/cache.js';
import { publishProductDeleted, syncProducts } from '../../lib/productEvents.js';

const router = Router();
const idParams = z.object({ id: objectId });

const refreshCaches = () => invalidate(CACHE_KEYS.home, CACHE_KEYS.categories);

// ---------------- Categories ----------------
const categoryBody = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang')
    .max(60)
    .optional(),
});

router.get('/categories', async (_req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    items: cats.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      productCount: byId.get(String(c._id)) || 0,
    })),
  });
});

router.post('/categories', validate({ body: categoryBody }), async (req, res) => {
  const { name, slug } = req.valid.body;
  const count = await Category.countDocuments();
  const cat = await Category.create({ name, slug: slug || slugify(name), sortOrder: count });
  await refreshCaches();
  res.status(201).json({ category: cat });
});

router.put('/categories/:id', validate({ params: idParams, body: categoryBody }), async (req, res) => {
  const cat = await Category.findById(req.valid.params.id);
  if (!cat) throw AppError.notFound('Không tìm thấy danh mục');
  cat.name = req.valid.body.name;
  if (req.valid.body.slug) cat.slug = req.valid.body.slug;
  await cat.save();
  await refreshCaches();
  res.json({ category: cat });
});

router.delete('/categories/:id', validate({ params: idParams }), async (req, res) => {
  const { id } = req.valid.params;
  if (await Product.exists({ category: id })) {
    throw AppError.conflict('Danh mục còn sản phẩm, không thể xóa', 'CATEGORY_NOT_EMPTY');
  }
  await Category.deleteOne({ _id: id });
  await refreshCaches();
  res.status(204).end();
});

// ---------------- Image upload ----------------
router.post('/uploads', uploadImages, (req, res) => {
  if (!req.files?.length) throw AppError.badRequest('Chưa chọn ảnh', undefined, 'NO_FILE');
  res.status(201).json({ urls: req.files.map((f) => publicUrl(f.filename)) });
});

// ---------------- Products ----------------
router.get(
  '/products',
  validate({ query: z.object({ ...pageQuery, q: trimmedSearch, category: objectId.optional() }) }),
  async (req, res) => {
    const { page, q, category } = req.valid.query;
    const limit = req.valid.query.limit || 12;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { 'variants.sku': rx }];
    }
    const [docs, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name')
        .lean(),
      Product.countDocuments(filter),
    ]);
    res.json({
      items: docs.map((p) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        category: p.category,
        image: p.images[0],
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        variantCount: p.variants.length,
        totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
        lowStock: p.variants.some((v) => v.stock <= 3),
        soldCount: p.soldCount,
        isActive: p.isActive,
      })),
      ...paginate(page, limit, total),
    });
  },
);

router.get('/products/:id', validate({ params: idParams }), async (req, res) => {
  const p = await Product.findById(req.valid.params.id).lean();
  if (!p) throw AppError.notFound('Không tìm thấy sản phẩm');
  res.json({ product: p });
});

const money = z.coerce.number().int('Giá phải là số nguyên').min(0, 'Giá không được âm').max(1e10);
const variantBody = z.object({
  _id: objectId.optional(),
  sku: z.string().trim().min(2, 'Nhập SKU').max(60),
  name: z.string().trim().min(1, 'Nhập tên phiên bản').max(120),
  price: money,
  costPrice: money,
  stock: z.coerce.number().int().min(0, 'Tồn kho không được âm').max(100000),
});

const productBody = z.object({
  name: z.string().trim().min(3, 'Tên sản phẩm tối thiểu 3 ký tự').max(160),
  brand: z.string().trim().min(1, 'Nhập thương hiệu').max(60),
  category: objectId,
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20).default([]),
  shortDescription: z
    .string()
    .trim()
    .max(5000)
    .refine((s) => s.split('\n').filter((l) => l.trim()).length >= 5, 'Mô tả cần tối thiểu 5 dòng'),
  specs: z
    .array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) }))
    .max(30)
    .default([]),
  images: z
    .array(z.string().regex(/^\/uploads\/[\w\-/.]+$/, 'Ảnh không hợp lệ'))
    .min(3, 'Cần tối thiểu 3 ảnh')
    .max(10),
  variants: z.array(variantBody).min(2, 'Mỗi sản phẩm cần tối thiểu 2 phiên bản').max(20),
  isActive: z.boolean().default(true),
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || 'san-pham';
  let slug = base;
  for (let i = 2; await Product.exists({ slug, _id: { $ne: excludeId } }); i += 1) slug = `${base}-${i}`;
  return slug;
}

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) {
    throw AppError.badRequest('Danh mục không tồn tại', [
      { path: 'category', message: 'Danh mục không tồn tại' },
    ]);
  }
}

function assertUniqueSkus(variants) {
  const skus = variants.map((v) => v.sku.toLowerCase());
  if (new Set(skus).size !== skus.length) {
    throw AppError.badRequest('SKU của các phiên bản phải khác nhau', [
      { path: 'variants', message: 'SKU bị trùng' },
    ]);
  }
}

router.post('/products', validate({ body: productBody }), async (req, res) => {
  const body = req.valid.body;
  await assertCategory(body.category);
  assertUniqueSkus(body.variants);
  const product = new Product({ ...body, slug: await uniqueSlug(body.name) });
  await product.save();
  await refreshCaches();
  syncProducts([product._id]);
  res.status(201).json({ product });
});

router.put('/products/:id', validate({ params: idParams, body: productBody }), async (req, res) => {
  const body = req.valid.body;
  const product = await Product.findById(req.valid.params.id);
  if (!product) throw AppError.notFound('Không tìm thấy sản phẩm');
  await assertCategory(body.category);
  assertUniqueSkus(body.variants);
  if (product.name !== body.name) product.slug = await uniqueSlug(body.name, product._id);
  const { variants, ...rest } = body;
  product.set(rest);
  // Keep variant _ids stable so carts and orders still reference them.
  product.variants = variants.map((v) => ({
    ...v,
    _id: v._id ? new mongoose.Types.ObjectId(v._id) : undefined,
  }));
  await product.save();
  await refreshCaches();
  syncProducts([product._id]);
  res.json({ product });
});

router.delete('/products/:id', validate({ params: idParams }), async (req, res) => {
  const r = await Product.deleteOne({ _id: req.valid.params.id });
  if (r.deletedCount === 0) throw AppError.notFound('Không tìm thấy sản phẩm');
  await refreshCaches();
  publishProductDeleted(req.valid.params.id);
  res.status(204).end();
});

export default router;
