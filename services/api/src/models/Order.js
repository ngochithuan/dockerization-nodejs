import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

// Allowed admin transitions (the happy path plus cancellation before delivery).
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    variantName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true },
    customerName: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      recipientName: String,
      phone: String,
      street: String,
      ward: String,
      district: String,
      city: String,
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    discountCode: { type: String, default: null },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cod', 'card'], required: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: {
      type: [{ _id: false, status: String, at: Date, note: String }],
      default: [],
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ discountCode: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
