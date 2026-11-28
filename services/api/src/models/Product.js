import mongoose from 'mongoose';

// Each variant has its own price, cost (for profit reports) and independent stock.
const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    shortDescription: { type: String, required: true },
    specs: { type: [{ _id: false, label: String, value: String }], default: [] },
    images: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ minPrice: 1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ createdAt: -1 });

// Keep the denormalised price range in sync with the variants.
productSchema.pre('save', function syncPrices(next) {
  const prices = this.variants.map((v) => v.price);
  this.minPrice = prices.length ? Math.min(...prices) : 0;
  this.maxPrice = prices.length ? Math.max(...prices) : 0;
  next();
});

export default mongoose.model('Product', productSchema);
