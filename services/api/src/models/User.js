import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    ward: { type: String, trim: true, maxlength: 100, default: '' },
    district: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, index: { sparse: true } },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isBanned: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    addresses: { type: [addressSchema], default: [] },
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

/** Fields safe to send to the account owner. */
userSchema.methods.toProfile = function toProfile() {
  return {
    id: this._id,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    loyaltyPoints: this.loyaltyPoints,
    hasPassword: Boolean(this.passwordHash),
    googleLinked: Boolean(this.googleId),
    addresses: this.addresses,
    createdAt: this.createdAt,
  };
};

export const formatAddress = (a) => [a.street, a.ward, a.district, a.city].filter(Boolean).join(', ');

export default mongoose.model('User', userSchema);
