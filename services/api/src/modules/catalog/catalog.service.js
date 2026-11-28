import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import AppError from '../../lib/AppError.js';
import { escapeRegex, paginate } from '../../lib/util.js';
import { cached, CACHE_KEYS } from '../../lib/cache.js';
import { searchProducts } from './search.client.js';

export const SORTS = {
  relevance: { createdAt: -1, _id: -1 }, // Mongo fallback has no score; ES ranks by relevance
  newest: { createdAt: -1, _id: -1 },
  'name-asc': { name: 1, _id: 1 },
  'name-desc': { name: -1, _id: -1 },
  'price-asc': { minPrice: 1, _id: 1 },
  'price-desc': { minPrice: -1, _id: -1 },
  'best-selling': { soldCount: -1, _id: -1 },
  'top-rated': { avgRating: -1, ratingCount: -1, _id: -1 },
};

const CARD_FIELDS =
  'name slug brand category tags shortDescription images minPrice maxPrice avgRating ratingCount soldCount variants.stock createdAt';

/** Lightweight product shape for grids. */
export function toCard(p) {
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    tags: p.tags,
    shortDescription: p.shortDescription,
    image: p.images?.[0] || null,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
    soldCount: p.soldCount,
    inStock: (p.variants || []).some((v) => v.stock > 0),
    createdAt: p.createdAt,
  };
}

export function listCategories() {
  return cached(CACHE_KEYS.categories, 300, async () => {
    const [cats, counts] = await Promise.all([
      Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    return cats.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      productCount: byId.get(String(c._id)) || 0,
    }));
  });
}

async function resolveCategory(slug) {
  if (!slug) return null;
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) throw AppError.notFound('Không tìm thấy danh mục', 'CATEGORY_NOT_FOUND');
  return cat;
}

/** Mongo filter shared by listing and the brand facet (facet ignores the brand filter itself). */
function buildFilter({ category, tag, minPrice, maxPrice, rating, q }, { includeBrand, brands }) {
  const filter = { isActive: true };
  if (category) filter.category = category._id;
  if (tag) filter.tags = tag;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.minPrice = {};
    if (minPrice !== undefined) filter.minPrice.$gte = minPrice;
    if (maxPrice !== undefined) filter.minPrice.$lte = maxPrice;
  }
  if (rating) filter.avgRating = { $gte: rating };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (includeBrand && brands?.length) filter.brand = { $in: brands };
  return filter;
}

async function brandFacet(filter) {
  const rows = await Product.aggregate([
    { $match: filter },
    { $group: { _id: '$brand', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ name: r._id, count: r.count }));
}

/**
 * Catalog listing. Keyword searches go through search-service (Elasticsearch) and fall back
 * to MongoDB regex search if it is unavailable. Everything else is served from MongoDB.
 */
export async function listProducts(query) {
  const { page, q, brand: brands = [] } = query;
  const sort = query.sort || (q ? 'relevance' : 'newest');
  const limit = query.limit || 12;
  const category = await resolveCategory(query.category);

  if (q) {
    const es = await searchProducts({
      q,
      category: category?._id,
      tag: query.tag,
      brand: brands,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      rating: query.rating,
      sort,
      from: (page - 1) * limit,
      size: limit,
    });
    if (es) {
      const docs = await Product.find({ _id: { $in: es.ids } })
        .select(CARD_FIELDS)
        .lean();
      const byId = new Map(docs.map((d) => [String(d._id), d]));
      const items = es.ids
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map(toCard);
      return {
        items,
        ...paginate(page, limit, es.total),
        facets: { brands: es.brands },
        engine: 'elasticsearch',
      };
    }
  }

  const filter = buildFilter({ ...query, category }, { includeBrand: true, brands });
  const facetFilter = buildFilter({ ...query, category }, { includeBrand: false });
  const [docs, total, brandsFacet] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(CARD_FIELDS)
      .lean(),
    Product.countDocuments(filter),
    brandFacet(facetFilter),
  ]);
  return {
    items: docs.map(toCard),
    ...paginate(page, limit, total),
    facets: { brands: brandsFacet },
    engine: 'mongodb',
  };
}

/** Landing page sections: new products, best sellers and three category showcases. */
export function homeSections() {
  return cached(CACHE_KEYS.home, 60, async () => {
    const base = { isActive: true };
    const pick = (filter, sort, n = 8) => Product.find(filter).sort(sort).limit(n).select(CARD_FIELDS).lean();
    const showcase = ['laptop', 'monitor', 'storage', 'gpu'];
    const cats = await Category.find({ slug: { $in: showcase } }).lean();
    const [newest, best, ...perCat] = await Promise.all([
      pick(base, SORTS.newest),
      pick(base, SORTS['best-selling']),
      ...showcase.map((slug) => {
        const c = cats.find((x) => x.slug === slug);
        return c ? pick({ ...base, category: c._id }, SORTS['best-selling'], 8) : Promise.resolve([]);
      }),
    ]);
    return {
      newProducts: newest.map(toCard),
      bestSellers: best.map(toCard),
      categories: showcase
        .map((slug, i) => {
          const c = cats.find((x) => x.slug === slug);
          return c && { name: c.name, slug: c.slug, items: perCat[i].map(toCard) };
        })
        .filter(Boolean),
    };
  });
}

export async function getProductBySlug(slug) {
  const p = await Product.findOne({ slug, isActive: true }).populate('category', 'name slug').lean();
  if (!p) throw AppError.notFound('Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  const related = await Product.find({ category: p.category._id, _id: { $ne: p._id }, isActive: true })
    .sort(SORTS['best-selling'])
    .limit(4)
    .select(CARD_FIELDS)
    .lean();
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    tags: p.tags,
    shortDescription: p.shortDescription,
    specs: p.specs,
    images: p.images,
    variants: p.variants.map((v) => ({
      id: v._id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      stock: v.stock,
    })),
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
    soldCount: p.soldCount,
    related: related.map(toCard),
  };
}
