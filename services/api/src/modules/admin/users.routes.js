import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { email, fullName, objectId, pageQuery, trimmedSearch } from '../../lib/schemas.js';
import { escapeRegex, paginate } from '../../lib/util.js';
import AppError from '../../lib/AppError.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import { invalidate, CACHE_KEYS } from '../../lib/cache.js';

const router = Router();
const idParams = z.object({ id: objectId });

const toRow = (u) => ({
  id: u._id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
  isBanned: u.isBanned,
  loyaltyPoints: u.loyaltyPoints,
  hasPassword: Boolean(u.passwordHash),
  googleLinked: Boolean(u.googleId),
  createdAt: u.createdAt,
});

router.get(
  '/users',
  validate({ query: z.object({ ...pageQuery, q: trimmedSearch }) }),
  async (req, res) => {
    const { page, q } = req.valid.query;
    const limit = req.valid.query.limit || 20;
    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ email: rx }, { fullName: rx }];
    }
    const [docs, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ items: docs.map(toRow), ...paginate(page, limit, total) });
  },
);

router.get('/users/:id', validate({ params: idParams }), async (req, res) => {
  const user = await User.findById(req.valid.params.id).lean();
  if (!user) throw AppError.notFound('Không tìm thấy người dùng');
  const [stats, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: { user: user._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, orders: { $sum: 1 }, spent: { $sum: '$total' } } },
    ]),
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).select('orderNumber total status createdAt').lean(),
  ]);
  res.json({
    user: { ...toRow(user), addresses: user.addresses },
    stats: { orders: stats[0]?.orders || 0, spent: stats[0]?.spent || 0 },
    recentOrders,
  });
});

router.patch(
  '/users/:id',
  validate({ params: idParams, body: z.object({ fullName, email }) }),
  async (req, res) => {
    const user = await User.findById(req.valid.params.id);
    if (!user) throw AppError.notFound('Không tìm thấy người dùng');
    const { fullName: name, email: mail } = req.valid.body;
    if (mail !== user.email && (await User.exists({ email: mail }))) {
      throw AppError.conflict('Email đã được sử dụng bởi tài khoản khác', 'EMAIL_TAKEN');
    }
    user.fullName = name;
    user.email = mail;
    await user.save();
    res.json({ user: toRow(user) });
  },
);

router.post(
  '/users/:id/ban',
  validate({ params: idParams, body: z.object({ banned: z.boolean() }) }),
  async (req, res) => {
    const user = await User.findById(req.valid.params.id);
    if (!user) throw AppError.notFound('Không tìm thấy người dùng');
    if (user.role === 'admin') throw AppError.badRequest('Không thể khóa tài khoản quản trị', undefined, 'CANNOT_BAN_ADMIN');
    user.isBanned = req.valid.body.banned;
    await user.save();
    await invalidate(CACHE_KEYS.user(user._id)); // takes effect immediately on every replica
    res.json({ user: toRow(user) });
  },
);

export default router;
