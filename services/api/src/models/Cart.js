import mongoose from 'mongoose';

// Server-side cart: keyed by `cartId` (guest cookie) or `user`. Guest carts expire after 30 days.
const cartSchema = new mongoose.Schema(
  {
    cartId: { type: String, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: {
      type: [
        {
          _id: false,
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
          variant: { type: mongoose.Schema.Types.ObjectId, required: true },
          qty: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

cartSchema.index({ cartId: 1 }, { unique: true, partialFilterExpression: { cartId: { $type: 'string' } } });
cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { cartId: { $type: 'string' } } },
);

export default mongoose.model('Cart', cartSchema);
