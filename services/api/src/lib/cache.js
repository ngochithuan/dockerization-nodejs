import { getRedis } from '../config/redis.js';

// Small JSON cache on Redis, shared by all api replicas. Failures degrade to "no cache".
export async function cached(key, ttlSeconds, producer) {
  const redis = getRedis();
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch {
    /* cache miss */
  }
  const value = await producer();
  redis.set(key, JSON.stringify(value), 'EX', ttlSeconds).catch(() => {});
  return value;
}

export async function invalidate(...keys) {
  try {
    await getRedis().del(...keys);
  } catch {
    /* ignore */
  }
}

export const CACHE_KEYS = {
  home: 'cache:home',
  categories: 'cache:categories',
  user: (id) => `cache:user:${id}`,
};
