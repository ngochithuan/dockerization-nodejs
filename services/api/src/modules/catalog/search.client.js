import env from '../../config/env.js';

// HTTP client for search-service (Elasticsearch). Returns null when the service is
// unavailable so the caller can fall back to MongoDB — the site never breaks.
export async function searchProducts(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else qs.set(k, String(v));
  }
  try {
    const res = await fetch(`${env.searchServiceUrl}/search?${qs}`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    return await res.json(); // { ids: string[], total: number, brands: [{name,count}] }
  } catch {
    return null;
  }
}
