import express from 'express';
import { brokerReady, publish, startConsumer } from './broker.js';
import { deleteProduct, ensureIndex, es, search, upsertProduct, waitForElastic } from './elastic.js';

// search-service: owns the Elasticsearch index.
//  - keeps it in sync by consuming product.upserted / product.deleted events (RabbitMQ)
//  - on an empty index, publishes search.reindex_requested so the catalogue is re-sent
//  - serves GET /search for the api (which falls back to MongoDB if this service is down)
const PORT = Number(process.env.PORT || 4000);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

const app = express();
app.disable('x-powered-by');
app.set('query parser', 'extended');

const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
const arr = (v) => (v === undefined ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);

app.get('/search', async (req, res) => {
  const q = req.query;
  try {
    const result = await search({
      q: typeof q.q === 'string' ? q.q.slice(0, 100) : '',
      category: typeof q.category === 'string' ? q.category : undefined,
      tag: typeof q.tag === 'string' ? q.tag : undefined,
      brand: arr(q.brand).slice(0, 30),
      minPrice: num(q.minPrice),
      maxPrice: num(q.maxPrice),
      rating: num(q.rating),
      sort: typeof q.sort === 'string' ? q.sort : 'relevance',
      from: Math.max(0, num(q.from) || 0),
      size: Math.min(100, Math.max(1, num(q.size) || 12)),
    });
    res.json(result);
  } catch (err) {
    console.error('[search] query failed', err.message);
    res.status(503).json({ error: { code: 'SEARCH_UNAVAILABLE', message: err.message, details: null } });
  }
});

app.get('/health', async (_req, res) => {
  let elasticsearch = false;
  try {
    elasticsearch = await es.ping();
  } catch {
    elasticsearch = false;
  }
  const ok = elasticsearch && brokerReady();
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', elasticsearch, rabbitmq: brokerReady() });
});

async function main() {
  await waitForElastic();
  const count = await ensureIndex();
  await startConsumer({
    url: RABBITMQ_URL,
    queue: 'search.events',
    bindings: ['product.upserted', 'product.deleted'],
    handler: async (routingKey, data) => {
      if (routingKey === 'product.upserted') await upsertProduct(data);
      else if (routingKey === 'product.deleted') await deleteProduct(data.id);
    },
  });
  if (count === 0) {
    publish('search.reindex_requested', { reason: 'empty-index' });
    console.log('[search] index empty — requested a full reindex');
  } else {
    console.log(`[search] index has ${count} products`);
  }
  app.listen(PORT, () => console.log(`[search] listening on :${PORT}`));
}

main().catch((err) => {
  console.error('[search] fatal', err);
  process.exit(1);
});
