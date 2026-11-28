import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

// Counters live in Redis so limits hold across all api replicas.
function limiter(prefix, windowMs, limit, keyGenerator) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator,
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args) => getRedis().call(...args),
    }),
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
          details: null,
        },
      }),
  });
}

const ipAndEmail = (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;

export const loginLimiter = limiter('login', 15 * 60 * 1000, 10, ipAndEmail);
export const registerLimiter = limiter('register', 60 * 60 * 1000, 10);
export const forgotLimiter = limiter('forgot', 15 * 60 * 1000, 5);
export const reviewLimiter = limiter('review', 10 * 60 * 1000, 20);
export const checkoutLimiter = limiter('checkout', 10 * 60 * 1000, 20);
