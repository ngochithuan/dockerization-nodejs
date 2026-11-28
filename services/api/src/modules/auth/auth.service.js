import bcrypt from 'bcryptjs';
import env from '../../config/env.js';
import User from '../../models/User.js';
import AppError from '../../lib/AppError.js';
import { publish } from '../../lib/broker.js';
import { createToken, hashToken } from '../../lib/util.js';
import { invalidate, CACHE_KEYS } from '../../lib/cache.js';

const BCRYPT_ROUNDS = 12;
export const RESET_TTL_MS = 30 * 60 * 1000; // password recovery link: 30 minutes
export const SETUP_TTL_MS = 7 * 24 * 60 * 60 * 1000; // "set your password" link for new accounts: 7 days

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

/** Issues a single-use password token; only its hash is stored. Returns the public link. */
export async function issuePasswordToken(user, ttlMs, { session } = {}) {
  const { token, hash } = createToken();
  user.resetTokenHash = hash;
  user.resetTokenExpires = new Date(Date.now() + ttlMs);
  await user.save({ session });
  return `${env.baseUrl}/reset-password?token=${token}`;
}

export async function register({ email, fullName, address }) {
  if (await User.exists({ email })) {
    throw AppError.conflict(
      'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.',
      'EMAIL_TAKEN',
    );
  }
  const user = new User({ email, fullName, addresses: [{ ...address, isDefault: true }] });
  const link = await issuePasswordToken(user, SETUP_TTL_MS);
  await publish('user.registered', { email, fullName, setPasswordUrl: link });
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    // Same message whether the email exists or not (no account enumeration).
    throw AppError.unauthorized('Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
  }
  if (user.isBanned) throw AppError.forbidden('Tài khoản của bạn đã bị khóa', 'ACCOUNT_BANNED');
  return user;
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user || user.isBanned) return; // respond identically either way
  const link = await issuePasswordToken(user, RESET_TTL_MS);
  await publish('password.reset_requested', { email: user.email, fullName: user.fullName, resetUrl: link });
}

/** Consumes a reset / set-password token (single use, must not be expired). */
export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) throw AppError.badRequest('Liên kết không hợp lệ hoặc đã hết hạn', undefined, 'INVALID_TOKEN');
  if (user.isBanned) throw AppError.forbidden('Tài khoản của bạn đã bị khóa', 'ACCOUNT_BANNED');
  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  await user.save();
  return user;
}

export async function checkToken(token) {
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  })
    .select('email passwordHash')
    .lean();
  return user
    ? { valid: true, email: user.email, hasPassword: Boolean(user.passwordHash) }
    : { valid: false };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized();
  if (user.passwordHash) {
    const ok = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!ok) {
      throw AppError.badRequest(
        'Mật khẩu hiện tại không đúng',
        [{ path: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }],
        'WRONG_PASSWORD',
      );
    }
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await invalidate(CACHE_KEYS.user(userId));
}

/** Google sign-in: find by googleId, else auto-link by verified email, else create. */
export async function loginWithGoogle({ sub, email, name }) {
  let user = await User.findOne({ googleId: sub });
  if (!user) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.googleId = sub;
      await user.save();
    } else {
      user = await User.create({ email, fullName: name || email.split('@')[0], googleId: sub });
    }
  }
  if (user.isBanned) throw AppError.forbidden('Tài khoản của bạn đã bị khóa', 'ACCOUNT_BANNED');
  return user;
}
