import jwt from 'jsonwebtoken';
import env, { isProd } from '../config/env.js';
import User from '../models/User.js';
import AppError from '../lib/AppError.js';
import { cached, CACHE_KEYS } from '../lib/cache.js';

export const AUTH_COOKIE = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd && env.baseUrl.startsWith('https'),
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
}

// Role and ban status are re-read from the DB (cached 60s in Redis, invalidated on change),
// never trusted from the token alone.
async function loadAuthState(userId) {
  return cached(CACHE_KEYS.user(userId), 60, async () => {
    const u = await User.findById(userId).select('role isBanned').lean();
    return u ? { id: String(u._id), role: u.role, isBanned: u.isBanned } : null;
  });
}

/** Attaches `req.auth = { id, role }` when a valid session cookie is present. */
export async function loadUser(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    clearAuthCookie(res);
    return next();
  }
  const state = await loadAuthState(payload.sub);
  if (!state) {
    clearAuthCookie(res);
    return next();
  }
  if (state.isBanned) {
    clearAuthCookie(res);
    return next(AppError.forbidden('Tài khoản của bạn đã bị khóa', 'ACCOUNT_BANNED'));
  }
  req.auth = { id: state.id, role: state.role };
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.auth) return next(AppError.unauthorized());
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.auth) return next(AppError.unauthorized());
  if (req.auth.role !== 'admin') return next(AppError.forbidden());
  next();
}
