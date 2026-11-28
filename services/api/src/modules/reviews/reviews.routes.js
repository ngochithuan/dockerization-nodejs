import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import validate from '../../middlewares/validate.js';
import { reviewLimiter } from '../../middlewares/rateLimit.js';
import { objectId, pageQuery } from '../../lib/schemas.js';
import { paginate } from '../../lib/util.js';
import AppError from '../../lib/AppError.js';
import Product from '../../models/Product.js';
import Rating from '../../models/Rating.js';
import Review from '../../models/Review.js';
import User from '../../models/User.js';
import { emitToProduct } from '../../socket.js';
import { invalidate, CACHE_KEYS } from '../../lib/cache.js';
import { syncProducts } from '../../lib/productEvents.js';

const router = Router({ mergeParams: true });

const toReview = (r) => ({
  id: r._id,
  authorName: r.authorName,
  isGuest: !r.user,
  comment: r.comment,
  rating: r.rating,
  createdAt: r.createdAt,
});

async function ratingSummary(productId) {
  const rows = await Rating.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$value', n: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;
  for (const r of rows) {
    distribution[r._id] = r.n;
    count += r.n;
    sum += r._id * r.n;
  }
  return { avgRating: count ? Math.round((sum / count) * 10) / 10 : 0, ratingCount: count, distribution };
}

async function ensureProduct(id) {
  const exists = await Product.exists({ _id: id, isActive: true });
  if (!exists) throw AppError.notFound('Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
}

router.get(
  '/',
  validate({ params: z.object({ productId: objectId }), query: z.object(pageQuery) }),
  async (req, res) => {
    const { productId } = req.valid.params;
    const { page } = req.valid.query;
    const limit = req.valid.query.limit || 5;
    await ensureProduct(productId);
    const [docs, total, summary, mine] = await Promise.all([
      Review.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: productId }),
      ratingSummary(productId),
      req.auth ? Rating.findOne({ product: productId, user: req.auth.id }).lean() : null,
    ]);
    res.json({
      items: docs.map(toReview),
      ...paginate(page, limit, total),
      summary,
      myRating: mine?.value || null,
    });
  },
);

const body = z
  .object({
    comment: z.string().trim().max(2000, 'Bình luận tối đa 2000 ký tự').optional().default(''),
    guestName: z.string().trim().max(60).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  })
  .refine((v) => v.comment.length > 0 || v.rating, {
    path: ['comment'],
    message: 'Vui lòng nhập bình luận',
  });

// Anyone may comment (guests give a display name). Star ratings require login.
router.post(
  '/',
  reviewLimiter,
  validate({ params: z.object({ productId: objectId }), body }),
  async (req, res) => {
    const { productId } = req.valid.params;
    const { comment, guestName, rating } = req.valid.body;
    await ensureProduct(productId);

    if (rating && !req.auth)
      throw AppError.unauthorized('Vui lòng đăng nhập để đánh giá sao', 'LOGIN_TO_RATE');
    if (!req.auth && (!guestName || guestName.length < 2)) {
      throw AppError.badRequest(
        'Vui lòng nhập tên hiển thị',
        [{ path: 'guestName', message: 'Vui lòng nhập tên hiển thị' }],
        'VALIDATION_ERROR',
      );
    }

    let summary = null;
    if (rating) {
      await Rating.findOneAndUpdate(
        { product: productId, user: req.auth.id },
        { value: rating },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      summary = await ratingSummary(productId);
      await Product.updateOne(
        { _id: productId },
        { avgRating: summary.avgRating, ratingCount: summary.ratingCount },
      );
      await invalidate(CACHE_KEYS.home);
      syncProducts([productId]);
      emitToProduct(productId, 'rating:updated', summary);
    }

    let review = null;
    if (comment) {
      const author = req.auth ? await User.findById(req.auth.id).select('fullName').lean() : null;
      const doc = await Review.create({
        product: productId,
        user: req.auth?.id || null,
        guestName: req.auth ? null : guestName,
        authorName: author?.fullName || guestName,
        comment,
        rating: rating || null,
      });
      review = toReview(doc);
      emitToProduct(productId, 'review:created', review);
    }

    res.status(201).json({ review, summary, myRating: rating || null });
  },
);

export default router;
