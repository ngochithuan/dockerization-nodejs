import Product from '../models/Product.js';
import { publish } from './broker.js';

// Search documents are pushed to search-service through RabbitMQ (no synchronous coupling).
export function toSearchDoc(p) {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: String(p.category?._id || p.category),
    tags: p.tags,
    shortDescription: p.shortDescription,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
    soldCount: p.soldCount,
    isActive: p.isActive,
    createdAt: new Date(p.createdAt).toISOString(),
  };
}

/** Fire-and-forget: republish the given products to keep the search index in sync. */
export function syncProducts(ids) {
  (async () => {
    const products = await Product.find({ _id: { $in: ids } }).lean();
    for (const p of products) await publish('product.upserted', toSearchDoc(p));
  })().catch((err) => console.error('[api] product sync failed:', err.message));
}

export function publishProductDeleted(id) {
  publish('product.deleted', { id: String(id) }).catch((err) =>
    console.error('[api] product.deleted publish failed:', err.message),
  );
}

/** Republishes the whole catalogue (on search-service request, e.g. after an empty index). */
export async function reindexAll() {
  const cursor = Product.find().lean().cursor();
  let n = 0;
  for await (const p of cursor) {
    await publish('product.upserted', toSearchDoc(p));
    n += 1;
  }
  console.log(`[api] reindex: published ${n} products`);
}
