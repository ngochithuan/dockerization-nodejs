import mongoose from 'mongoose';

// 5-char alphanumeric code, percentage discount, no expiry, usage limit 1..10.
const discountCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, match: /^[A-Z0-9]{5}$/ },
    percent: { type: Number, required: true, min: 1, max: 100 },
    usageLimit: { type: Number, required: true, min: 1, max: 10 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('DiscountCode', discountCodeSchema);
