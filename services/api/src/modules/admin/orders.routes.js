import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import validate from '../../middlewares/validate.js';
import { objectId, pageQuery } from '../../lib/schemas.js';
import { paginate, parseVnDay, vnDate, vnParts, vnStartOfDay } from '../../lib/util.js';
import AppError from '../../lib/AppError.js';
import Order, { STATUS_TRANSITIONS } from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import { publish } from '../../lib/broker.js';
import { syncProducts } from '../../lib/productEvents.js';
import { toEmailPayload } from '../orders/order.serializer.js';

const router = Router();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ');

/** Time-range filter in Vietnam time. */
function rangeFilter({ range, from, to }) {
  const today = vnStartOfDay();
  const DAY = 86_400_000;
  switch (range) {
    case 'today':
      return { $gte: today };
    case 'yesterday':
      return { $gte: new Date(today - DAY), $lt: today };
    case 'week': {
      const { dow } = vnParts();
      return { $gte: new Date(today - ((dow + 6) % 7) * DAY) };
    }
    case 'month': {
      const { y, m } = vnParts();
      return { $gte: vnDate(y, m, 1) };
    }
    case 'custom': {
      const f = {};
      if (from) f.$gte = parseVnDay(from);
      if (to) f.$lt = new Date(parseVnDay(to).getTime() + DAY);
      return Object.keys(f).length ? f : null;
    }
    default:
      return null;
  }
}

router.get(
  '/orders',
  validate({
    query: z.object({
      ...pageQuery,
      range: z.enum(['all', 'today', 'yesterday', 'week', 'month', 'custom']).default('all'),
      from: day.optional(),
      to: day.optional(),
    }),
  }),
  async (req, res) => {
    const { page } = req.valid.query;
    const limit = 20;
    const filter = {};
    const createdAt = rangeFilter(req.valid.query);
    if (createdAt) filter.createdAt = createdAt;
    const [docs, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber customerName email total status paymentMethod createdAt items.qty discountCode')
        .lean(),
      Order.countDocuments(filter),
    ]);
    res.json({
      items: docs.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        email: o.email,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.reduce((s, i) => s + i.qty, 0),
        discountCode: o.discountCode,
        createdAt: o.createdAt,
      })),
      ...paginate(page, limit, total),
    });
  },
);

router.get('/orders/:id', validate({ params: z.object({ id: objectId }) }), async (req, res) => {
  const order = await Order.findById(req.valid.params.id).lean();
  if (!order) throw AppError.notFound('Không tìm thấy đơn hàng');
  order.statusHistory.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json({ order, allowedNext: STATUS_TRANSITIONS[order.status] });
});

router.patch(
  '/orders/:id/status',
  validate({
    params: z.object({ id: objectId }),
    body: z.object({
      status: z.enum(['confirmed', 'shipping', 'delivered', 'cancelled']),
      note: z.string().trim().max(300).optional().default(''),
      notify: z.boolean().optional().default(true),
    }),
  }),
  async (req, res) => {
    const { status, note, notify } = req.valid.body;
    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        order = await Order.findById(req.valid.params.id).session(session);
        if (!order) throw AppError.notFound('Không tìm thấy đơn hàng');
        if (!STATUS_TRANSITIONS[order.status].includes(status)) {
          throw AppError.badRequest(
            `Không thể chuyển trạng thái từ "${order.status}" sang "${status}"`,
            undefined,
            'INVALID_TRANSITION',
          );
        }
        if (status === 'cancelled') {
          // Return stock, sold counters and loyalty points.
          for (const i of order.items) {
            await Product.updateOne(
              { _id: i.product, 'variants._id': i.variant },
              { $inc: { 'variants.$.stock': i.qty, soldCount: -i.qty } },
              { session },
            );
          }
          const u = await User.findById(order.user).session(session);
          if (u) {
            u.loyaltyPoints = Math.max(0, u.loyaltyPoints + order.pointsUsed - order.pointsEarned);
            await u.save({ session });
          }
          if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
        }
        if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
        order.status = status;
        order.statusHistory.push({ status, at: new Date(), note: note || undefined });
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }
    if (status === 'cancelled') syncProducts(order.items.map((i) => i.product));
    if (notify) {
      publish('order.status_changed', { order: toEmailPayload(order), status, note }).catch((err) =>
        console.error('[api] order.status_changed publish failed', err.message),
      );
    }
    const plain = order.toObject();
    plain.statusHistory.sort((a, b) => new Date(b.at) - new Date(a.at));
    res.json({ order: plain, allowedNext: STATUS_TRANSITIONS[order.status] });
  },
);

export default router;
