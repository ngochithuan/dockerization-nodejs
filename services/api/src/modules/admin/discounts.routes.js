import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import AppError from '../../lib/AppError.js';
import DiscountCode from '../../models/DiscountCode.js';
import Order from '../../models/Order.js';

// Discount management: view list (+ orders that used each code) and create. Nothing else.
const router = Router();

router.get('/discounts', async (_req, res) => {
  const [codes, usage] = await Promise.all([
    DiscountCode.find().sort({ createdAt: -1 }).lean(),
    Order.aggregate([
      { $match: { discountCode: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$discountCode',
          orders: {
            $push: {
              id: '$_id',
              orderNumber: '$orderNumber',
              customerName: '$customerName',
              total: '$total',
              discountAmount: '$discountAmount',
              status: '$status',
              createdAt: '$createdAt',
            },
          },
        },
      },
    ]),
  ]);
  const byCode = new Map(usage.map((u) => [u._id, u.orders]));
  res.json({
    items: codes.map((c) => ({
      id: c._id,
      code: c.code,
      percent: c.percent,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      createdAt: c.createdAt,
      orders: byCode.get(c.code) || [],
    })),
  });
});

router.post(
  '/discounts',
  validate({
    body: z.object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{5}$/, 'Mã gồm đúng 5 ký tự chữ hoặc số'),
      percent: z.coerce
        .number()
        .int('Phần trăm phải là số nguyên')
        .min(1, 'Tối thiểu 1%')
        .max(90, 'Tối đa 90%'),
      usageLimit: z.coerce.number().int().min(1, 'Tối thiểu 1 lượt').max(10, 'Tối đa 10 lượt'),
    }),
  }),
  async (req, res) => {
    if (await DiscountCode.exists({ code: req.valid.body.code })) {
      throw AppError.conflict('Mã giảm giá đã tồn tại', 'CODE_TAKEN', [
        { path: 'code', message: 'Mã đã tồn tại' },
      ]);
    }
    const code = await DiscountCode.create(req.valid.body);
    res.status(201).json({ discount: code });
  },
);

export default router;
