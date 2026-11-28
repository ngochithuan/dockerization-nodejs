// Customer-facing order shape (never exposes unit costs).
export function toCustomerOrder(o) {
  return {
    id: o._id,
    orderNumber: o.orderNumber,
    email: o.email,
    customerName: o.customerName,
    items: o.items.map((i) => ({
      productId: i.product,
      variantId: i.variant,
      productName: i.productName,
      variantName: i.variantName,
      image: i.image,
      unitPrice: i.unitPrice,
      qty: i.qty,
      lineTotal: i.unitPrice * i.qty,
    })),
    shippingAddress: o.shippingAddress,
    subtotal: o.subtotal,
    tax: o.tax,
    shippingFee: o.shippingFee,
    discountCode: o.discountCode,
    discountPercent: o.discountPercent,
    discountAmount: o.discountAmount,
    pointsUsed: o.pointsUsed,
    pointsEarned: o.pointsEarned,
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    statusHistory: [...o.statusHistory].sort((a, b) => new Date(b.at) - new Date(a.at)),
    createdAt: o.createdAt,
  };
}

/** Payload for e-mail events (notification-service renders it). */
export function toEmailPayload(o) {
  const c = toCustomerOrder(o);
  return { ...c, id: String(c.id), createdAt: new Date(c.createdAt).toISOString() };
}
