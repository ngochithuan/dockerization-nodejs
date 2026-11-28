import Redis from 'ioredis';
import env from './env.js';

// Shared Redis connection for cache / rate-limit store. Lazily created so unit tests
// that never touch Redis don't open sockets.
let client;

export function getRedis() {
  if (!client) {
    client = new Redis(env.redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false });
    client.on('error', (err) => console.error('[api] redis error:', err.message));
  }
  return client;
}

export async function redisReady() {
  if (!client) return false;
  try {
    return (await client.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis() {
  if (client) await client.quit();
}
