import mongoose from 'mongoose';

// A comment on a product. Anyone can comment; guests supply a display name.
// `rating` is a snapshot of the author's star rating when the comment was written (logged-in only).
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestName: { type: String, trim: true, maxlength: 60, default: null },
    authorName: { type: String, required: true, trim: true, maxlength: 100 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
