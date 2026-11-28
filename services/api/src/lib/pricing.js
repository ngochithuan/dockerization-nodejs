// Store pricing rules — single source of truth for cart, checkout quote and order placement.
export const VAT_RATE = 0.1; // 10% VAT on the discounted subtotal
export const SHIPPING_FEE = 30_000; // flat fee…
export const FREE_SHIPPING_THRESHOLD = 5_000_000; // …waived when subtotal >= 5,000,000đ
export const POINT_VALUE = 1_000; // 1 loyalty point = 1,000đ
export const POINTS_EARN_RATE = 0.1; // earn 10% of the amount paid, as points

/**
 * @param {number} subtotal Σ unitPrice × qty
 * @param {{ discountPercent?: number, pointsRequested?: number, pointsBalance?: number }} opts
 */
export function computeTotals(
  subtotal,
  { discountPercent = 0, pointsRequested = 0, pointsBalance = 0 } = {},
) {
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = Math.round(afterDiscount * VAT_RATE);
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const beforePoints = afterDiscount + tax + shippingFee;

  const maxPoints = Math.min(Math.max(0, Math.floor(pointsBalance)), Math.floor(beforePoints / POINT_VALUE));
  const pointsUsed = Math.min(Math.max(0, Math.floor(pointsRequested)), maxPoints);
  const total = beforePoints - pointsUsed * POINT_VALUE;
  const pointsEarned = Math.floor((total * POINTS_EARN_RATE) / POINT_VALUE);

  return {
    subtotal,
    discountPercent,
    discountAmount,
    tax,
    shippingFee,
    pointsUsed,
    pointsValue: pointsUsed * POINT_VALUE,
    maxPoints,
    total,
    pointsEarned,
  };
}
