import mongoose from 'mongoose';
import Cart from '../../models/Cart.js';
import Counter from '../../models/Counter.js';
import DiscountCode from '../../models/DiscountCode.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import AppError from '../../lib/AppError.js';
import { publish } from '../../lib/broker.js';
import { computeTotals } from '../../lib/pricing.js';
import { vnParts } from '../../lib/util.js';
import { invalidate, CACHE_KEYS } from '../../lib/cache.js';
import { syncProducts } from '../../lib/productEvents.js';
import { CART_COOKIE, resolveItems } from '../cart/cart.service.js';
import { issuePasswordToken, SETUP_TTL_MS } from '../auth/auth.service.js';
import { toCustomerOrder, toEmailPayload } from './order.serializer.js';

export const normaliseCode = (code) => (code ? String(code).trim().toUpperCase() : '');

function cartFilter(req) {
  if (req.auth) return { user: req.auth.id };
  const cid = req.cookies?.[CART_COOKIE];
  return cid ? { cartId: cid } : null;
}

/** Validates a code without consuming it. */
export async function checkDiscount(rawCode) {
  const code = normaliseCode(rawCode);
  if (!code) return null;
  if (!/^[A-Z0-9]{5}$/.test(code)) {
    return { code, valid: false, message: 'Mã giảm giá gồm đúng 5 ký tự chữ hoặc số' };
  }
  const d = await DiscountCode.findOne({ code }).lean();
  if (!d) return { code, valid: false, message: 'Mã giảm giá không tồn tại' };
  if (d.usedCount >= d.usageLimit) return { code, valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
  return {
    code,
    valid: true,
    percent: d.percent,
    remaining: d.usageLimit - d.usedCount,
    message: `Giảm ${d.percent}% tổng tiền hàng (còn ${d.usageLimit - d.usedCount} lượt)`,
  };
}

/** Checkout preview: totals for the current cart with an optional code and points. */
export async function quote(req, { discountCode, pointsToUse }) {
  const f = cartFilter(req);
  const cart = f ? await Cart.findOne(f).lean() : null;
  const lines = cart ? (await resolveItems(cart.items)).filter((l) => l.available) : [];
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discount = await checkDiscount(discountCode);
  const balance = req.auth
    ? (await User.findById(req.auth.id).select('loyaltyPoints').lean())?.loyaltyPoints || 0
    : 0;
  const summary = computeTotals(subtotal, {
    discountPercent: discount?.valid ? discount.percent : 0,
    pointsRequested: req.auth ? pointsToUse : 0,
    pointsBalance: balance,
  });
  return { summary, discount, pointsBalance: balance, itemCount: lines.reduce((s, l) => s + l.qty, 0) };
}

async function nextOrderNumber(session) {
  const { y, m, d } = vnParts();
  const day = `${String(y).slice(2)}${String(m + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
  const c = await Counter.findOneAndUpdate(
    { _id: `order-${day}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session },
  );
  return `PC${day}${String(c.seq).padStart(4, '0')}`;
}

/**
 * Places an order atomically (MongoDB transaction): stock decrement per variant, discount
 * usage, loyalty points, sold counters, order creation and cart clearing all commit or none do.
 */
export async function placeOrder(req, input) {
  const f = cartFilter(req);
  if (!f) throw AppError.badRequest('Giỏ hàng trống', undefined, 'CART_EMPTY');
  const code = normaliseCode(input.discountCode);
  const session = await mongoose.startSession();
  let order;
  let setPasswordUrl = null;

  try {
    await session.withTransaction(async () => {
      setPasswordUrl = null;
      const cart = await Cart.findOne(f).session(session);
      if (!cart || cart.items.length === 0)
        throw AppError.badRequest('Giỏ hàng trống', undefined, 'CART_EMPTY');
      const lines = await resolveItems(cart.items);
      const unavailable = lines.find((l) => !l.available);
      if (unavailable) {
        throw AppError.conflict(
          'Một sản phẩm trong giỏ không còn kinh doanh, vui lòng xóa khỏi giỏ',
          'ITEM_UNAVAILABLE',
        );
      }

      // 1. Decrement stock per variant, only if enough is left.
      for (const l of lines) {
        const r = await Product.updateOne(
          { _id: l.productId, variants: { $elemMatch: { _id: l.variantId, stock: { $gte: l.qty } } } },
          { $inc: { 'variants.$.stock': -l.qty, soldCount: l.qty } },
          { session },
        );
        if (r.modifiedCount !== 1) {
          throw AppError.conflict(
            `"${l.name} – ${l.variantName}" không đủ hàng (còn ${l.stock})`,
            'INSUFFICIENT_STOCK',
            { productId: l.productId, variantId: l.variantId },
          );
        }
      }

      // 2. Consume one use of the discount code, only while usedCount < usageLimit.
      let discountPercent = 0;
      if (code) {
        const d = await DiscountCode.findOneAndUpdate(
          { code, $expr: { $lt: ['$usedCount', '$usageLimit'] } },
          { $inc: { usedCount: 1 } },
          { new: true, session },
        );
        if (!d)
          throw AppError.badRequest(
            'Mã giảm giá không hợp lệ hoặc đã hết lượt',
            undefined,
            'DISCOUNT_INVALID',
          );
        discountPercent = d.percent;
      }

      // 3. Resolve the customer account (guest checkout auto-creates one).
      let user;
      if (req.auth) {
        user = await User.findById(req.auth.id).session(session);
      } else {
        user = await User.findOne({ email: input.email }).session(session);
        if (user?.isBanned)
          throw AppError.forbidden('Tài khoản gắn với email này đã bị khóa', 'ACCOUNT_BANNED');
        if (!user) {
          user = new User({
            email: input.email,
            fullName: input.fullName,
            addresses: [{ ...input.shippingAddress, isDefault: true }],
          });
          setPasswordUrl = await issuePasswordToken(user, SETUP_TTL_MS, { session });
        }
      }
      if (req.auth && input.saveAddress) {
        user.addresses.push({ ...input.shippingAddress, isDefault: user.addresses.length === 0 });
        await user.save({ session });
      }

      // 4. Totals (server-side prices) and loyalty points.
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const totals = computeTotals(subtotal, {
        discountPercent,
        pointsRequested: req.auth ? input.pointsToUse : 0,
        pointsBalance: user.loyaltyPoints,
      });
      const pointsDelta = totals.pointsEarned - totals.pointsUsed;
      const pr = await User.updateOne(
        { _id: user._id, loyaltyPoints: { $gte: totals.pointsUsed } },
        { $inc: { loyaltyPoints: pointsDelta } },
        { session },
      );
      if (pr.matchedCount !== 1) throw AppError.conflict('Số điểm tích lũy không đủ', 'POINTS_INSUFFICIENT');

      // 5. Create the order with its first status-history entry, then clear the cart.
      const now = new Date();
      [order] = await Order.create(
        [
          {
            orderNumber: await nextOrderNumber(session),
            user: user._id,
            email: user.email,
            customerName: req.auth ? user.fullName : input.fullName,
            items: lines.map((l) => ({
              product: l.productId,
              variant: l.variantId,
              productName: l.name,
              variantName: l.variantName,
              category: l.category,
              image: l.image,
              unitPrice: l.price,
              unitCost: l.cost,
              qty: l.qty,
            })),
            shippingAddress: input.shippingAddress,
            subtotal: totals.subtotal,
            tax: totals.tax,
            shippingFee: totals.shippingFee,
            discountCode: code || null,
            discountPercent,
            discountAmount: totals.discountAmount,
            pointsUsed: totals.pointsUsed,
            pointsEarned: totals.pointsEarned,
            total: totals.total,
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentMethod === 'card' ? 'paid' : 'unpaid',
            status: 'pending',
            statusHistory: [{ status: 'pending', at: now, note: 'Đơn hàng đã được tạo' }],
          },
        ],
        { session },
      );
      cart.items = [];
      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await invalidate(CACHE_KEYS.home);
  syncProducts(order.items.map((i) => i.product));
  publish('order.created', { order: toEmailPayload(order), setPasswordUrl }).catch((err) =>
    console.error('[api] failed to publish order.created', err.message),
  );
  return { order: toCustomerOrder(order), accountCreated: Boolean(setPasswordUrl) };
}
