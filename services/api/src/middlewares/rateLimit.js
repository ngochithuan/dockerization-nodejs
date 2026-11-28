import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

// Counters live in Redis so limits hold across all api replicas.
// The limiter (and its Redis store, which loads a Lua script on creation) is built lazily on
// the first request, so importing the app never touches Redis — e.g. in unit tests or CI.
function limiter(prefix, windowMs, limit, keyGenerator) {
  let instance;
  return (req, res, next) => {
    instance ??= rateLimit({
      windowMs,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator,
      validate: { creationStack: false }, // intentionally created inside the first request
      store: new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args) => getRedis().call(...args),
      }),
      handler: (_req, res2) =>
        res2.status(429).json({
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
            details: null,
          },
        }),
    });
    return instance(req, res, next);
  };
}

const ipAndEmail = (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;

export const loginLimiter = limiter('login', 15 * 60 * 1000, 10, ipAndEmail);
export const registerLimiter = limiter('register', 60 * 60 * 1000, 10);
export const forgotLimiter = limiter('forgot', 15 * 60 * 1000, 5);
export const reviewLimiter = limiter('review', 10 * 60 * 1000, 20);
export const checkoutLimiter = limiter('checkout', 10 * 60 * 1000, 20);
