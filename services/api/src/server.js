import http from 'node:http';
import env from './config/env.js';
import { createApp } from './app.js';
import { connectMongo, disconnectMongo } from './config/db.js';
import { getRedis, closeRedis } from './config/redis.js';
import { connectBroker, closeBroker, consume } from './lib/broker.js';
import { reindexAll } from './lib/productEvents.js';
import { initSocket } from './socket.js';
import { instance } from './middlewares/servedBy.js';

async function main() {
  await connectMongo();
  getRedis();
  await consume('api.search-reindex', ['search.reindex_requested'], reindexAll);
  await connectBroker();

  const server = http.createServer(createApp());
  initSocket(server);
  server.listen(env.port, () => console.log(`[api] ${instance} listening on :${env.port}`));

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close();
    await Promise.allSettled([disconnectMongo(), closeRedis(), closeBroker()]);
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[api] fatal startup error', err);
  process.exit(1);
});
