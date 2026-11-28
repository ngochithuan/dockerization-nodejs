import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { checkoutLimiter } from '../../middlewares/rateLimit.js';
import { address, email, fullName, pageQuery, phone } from '../../lib/schemas.js';
import { paginate } from '../../lib/util.js';
import AppError from '../../lib/AppError.js';
import Order from '../../models/Order.js';
import * as checkout from './checkout.service.js';
import { toCustomerOrder } from './order.serializer.js';

const router = Router();

const discountCode = z.string().trim().max(20).optional();
const pointsToUse = z.coerce.number().int().min(0).max(1e7).optional().default(0);

router.post(
  '/checkout/quote',
  validate({ body: z.object({ discountCode, pointsToUse }) }),
  async (req, res) => {
    res.json(await checkout.quote(req, req.valid.body));
  },
);

// ---- Simulated card payment: format validation only, card data is never stored or logged ----
function luhn(num) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const card = z.object({
  number: z
    .string()
    .transform((s) => s.replace(/\s+/g, ''))
    .refine((s) => /^\d{13,19}$/.test(s) && luhn(s), 'Số thẻ không hợp lệ'),
  holder: z.string().trim().min(2, 'Vui lòng nhập tên chủ thẻ').max(60),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Định dạng MM/YY')
    .refine((s) => {
      const [mm, yy] = s.split('/').map(Number);
      return new Date(2000 + yy, mm, 1) > new Date();
    }, 'Thẻ đã hết hạn'),
  cvc: z.string().regex(/^\d{3,4}$/, 'CVC gồm 3–4 chữ số'),
});

const orderBody = z
  .object({
    email: email.optional(),
    fullName: fullName.optional(),
    shippingAddress: address.extend({ phone }),
    saveAddress: z.boolean().optional().default(false),
    paymentMethod: z.enum(['cod', 'card']),
    card: card.optional(),
    discountCode,
    pointsToUse,
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod === 'card' && !v.card) {
      ctx.addIssue({ code: 'custom', path: ['card'], message: 'Vui lòng nhập thông tin thẻ' });
    }
  });

router.post('/orders', checkoutLimiter, validate({ body: orderBody }), async (req, res) => {
  const body = req.valid.body;
  if (!req.auth && (!body.email || !body.fullName)) {
    throw AppError.badRequest('Vui lòng nhập email và họ tên', [
      ...(body.email ? [] : [{ path: 'email', message: 'Vui lòng nhập email' }]),
      ...(body.fullName ? [] : [{ path: 'fullName', message: 'Vui lòng nhập họ tên' }]),
    ], 'VALIDATION_ERROR');
  }
  delete body.card; // payment simulated — discard card data immediately
  res.status(201).json(await checkout.placeOrder(req, body));
});

// ---- Customer order history / tracking (login required, own orders only) ----
router.get('/orders', requireAuth, validate({ query: z.object(pageQuery) }), async (req, res) => {
  const { page } = req.valid.query;
  const limit = req.valid.query.limit || 10;
  const filter = { user: req.auth.id };
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items: docs.map(toCustomerOrder), ...paginate(page, limit, total) });
});

router.get(
  '/orders/:orderNumber',
  requireAuth,
  validate({ params: z.object({ orderNumber: z.string().regex(/^PC\d{10}$/, 'Mã đơn không hợp lệ') }) }),
  async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.valid.params.orderNumber, user: req.auth.id }).lean();
    if (!order) throw AppError.notFound('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
    res.json({ order: toCustomerOrder(order) });
  },
);

export default router;
