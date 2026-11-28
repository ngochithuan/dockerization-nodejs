import crypto from 'node:crypto';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import AppError from '../../lib/AppError.js';
import { computeTotals } from '../../lib/pricing.js';

export const CART_COOKIE = 'cid';
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' };

/** Mongo filter identifying the caller's cart (user cart when logged in, else guest cookie). */
function ownerFilter(req) {
  if (req.auth) return { user: req.auth.id };
  const cid = req.cookies?.[CART_COOKIE];
  return cid ? { cartId: cid } : null;
}

async function findCart(req) {
  const f = ownerFilter(req);
  return f ? Cart.findOne(f) : null;
}

async function findOrCreateCart(req, res) {
  const existing = await findCart(req);
  if (existing) return existing;
  if (req.auth) return Cart.create({ user: req.auth.id, items: [] });
  const cid = crypto.randomUUID();
  res.cookie(CART_COOKIE, cid, COOKIE_OPTS);
  return Cart.create({ cartId: cid, items: [] });
}

/** Resolve cart items against live product data. Prices always come from the DB. */
export async function resolveItems(items) {
  const ids = [...new Set(items.map((i) => String(i.product)))];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return items.map((i) => {
    const p = byId.get(String(i.product));
    const v = p?.variants.find((x) => String(x._id) === String(i.variant));
    const available = Boolean(p && p.isActive && v);
    return {
      productId: String(i.product),
      variantId: String(i.variant),
      qty: i.qty,
      available,
      product: p,
      variant: v,
      name: p?.name || 'Sản phẩm không còn kinh doanh',
      slug: p?.slug,
      image: p?.images?.[0] || null,
      category: p?.category,
      variantName: v?.name || '',
      price: v?.price || 0,
      cost: v?.costPrice || 0,
      stock: v?.stock || 0,
      lineTotal: available ? v.price * i.qty : 0,
    };
  });
}

function serialize(lines) {
  const valid = lines.filter((l) => l.available);
  const subtotal = valid.reduce((s, l) => s + l.lineTotal, 0);
  return {
    items: lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      name: l.name,
      slug: l.slug,
      image: l.image,
      variantName: l.variantName,
      price: l.price,
      stock: l.stock,
      qty: l.qty,
      lineTotal: l.lineTotal,
      available: l.available,
      exceedsStock: l.available && l.qty > l.stock,
    })),
    itemCount: valid.reduce((s, l) => s + l.qty, 0),
    summary: computeTotals(subtotal),
  };
}

export async function getCart(req) {
  const cart = await findCart(req);
  return serialize(cart ? await resolveItems(cart.items) : []);
}

async function loadVariant(productId, variantId) {
  const p = await Product.findOne({ _id: productId, isActive: true }).lean();
  const v = p?.variants.find((x) => String(x._id) === variantId);
  if (!v) throw AppError.notFound('Sản phẩm hoặc phiên bản không tồn tại', 'VARIANT_NOT_FOUND');
  return v;
}

function stockError(v) {
  return AppError.conflict(
    v.stock > 0 ? `Phiên bản này chỉ còn ${v.stock} sản phẩm` : 'Phiên bản này đã hết hàng',
    'INSUFFICIENT_STOCK',
    { stock: v.stock },
  );
}

export async function addItem(req, res, { productId, variantId, qty }) {
  const v = await loadVariant(productId, variantId);
  const cart = await findOrCreateCart(req, res);
  const line = cart.items.find((i) => String(i.product) === productId && String(i.variant) === variantId);
  const newQty = (line?.qty || 0) + qty;
  if (newQty > v.stock) throw stockError(v);
  if (line) line.qty = newQty;
  else cart.items.push({ product: productId, variant: variantId, qty });
  await cart.save();
  return serialize(await resolveItems(cart.items));
}

export async function setItemQty(req, { productId, variantId, qty }) {
  const cart = await findCart(req);
  const line = cart?.items.find((i) => String(i.product) === productId && String(i.variant) === variantId);
  if (!line) throw AppError.notFound('Sản phẩm không có trong giỏ', 'CART_ITEM_NOT_FOUND');
  const v = await loadVariant(productId, variantId);
  if (qty > v.stock) throw stockError(v);
  line.qty = qty;
  await cart.save();
  return serialize(await resolveItems(cart.items));
}

export async function removeItem(req, { productId, variantId }) {
  const cart = await findCart(req);
  if (cart) {
    cart.items = cart.items.filter(
      (i) => !(String(i.product) === productId && String(i.variant) === variantId),
    );
    await cart.save();
  }
  return serialize(cart ? await resolveItems(cart.items) : []);
}

/** Move the guest cookie cart into the user's cart on login (quantities capped by stock). */
export async function mergeGuestCart(req, res, userId) {
  const cid = req.cookies?.[CART_COOKIE];
  if (!cid) return;
  res.clearCookie(CART_COOKIE, { path: '/' });
  const guest = await Cart.findOne({ cartId: cid });
  if (!guest || guest.items.length === 0) {
    if (guest) await guest.deleteOne();
    return;
  }
  const userCart = (await Cart.findOne({ user: userId })) || new Cart({ user: userId, items: [] });
  const lines = await resolveItems(guest.items);
  for (const l of lines) {
    if (!l.available) continue;
    const existing = userCart.items.find(
      (i) => String(i.product) === l.productId && String(i.variant) === l.variantId,
    );
    const qty = Math.min((existing?.qty || 0) + l.qty, l.stock);
    if (qty <= 0) continue;
    if (existing) existing.qty = qty;
    else userCart.items.push({ product: l.productId, variant: l.variantId, qty });
  }
  await userCart.save();
  await guest.deleteOne();
}
