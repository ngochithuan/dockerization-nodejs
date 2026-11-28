import { Client } from '@elastic/elasticsearch';

export const INDEX = 'products_v2';
export const es = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

const MAPPING = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        // Lowercase + strip Vietnamese diacritics so "man hinh" matches "màn hình".
        folding: { type: 'custom', tokenizer: 'standard', filter: ['lowercase', 'asciifolding'] },
      },
      normalizer: { lower: { type: 'custom', filter: ['lowercase', 'asciifolding'] } },
    },
  },
  mappings: {
    properties: {
      // `all` gathers every searchable field so multi-word queries can require all terms.
      all: { type: 'text', analyzer: 'folding' },
      name: {
        type: 'text',
        analyzer: 'folding',
        copy_to: 'all',
        fields: { sort: { type: 'keyword', normalizer: 'lower' } },
      },
      categoryName: { type: 'text', analyzer: 'folding', copy_to: 'all' },
      slug: { type: 'keyword' },
      brand: { type: 'text', analyzer: 'folding', copy_to: 'all', fields: { keyword: { type: 'keyword' } } },
      category: { type: 'keyword' },
      tags: { type: 'text', analyzer: 'folding', copy_to: 'all', fields: { keyword: { type: 'keyword' } } },
      shortDescription: { type: 'text', analyzer: 'folding', copy_to: 'all' },
      minPrice: { type: 'long' },
      maxPrice: { type: 'long' },
      avgRating: { type: 'float' },
      ratingCount: { type: 'integer' },
      soldCount: { type: 'integer' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'date' },
    },
  },
};

export async function waitForElastic(retries = 60) {
  for (let i = 1; ; i += 1) {
    try {
      await es.cluster.health({ wait_for_status: 'yellow', timeout: '5s' });
      return;
    } catch (err) {
      if (i >= retries) throw err;
      console.warn(`[search] Elasticsearch not ready (${err.message}), retry ${i}/${retries}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function ensureIndex() {
  if (!(await es.indices.exists({ index: INDEX }))) {
    await es.indices.create({ index: INDEX, ...MAPPING });
    console.log('[search] created index', INDEX);
  }
  const { count } = await es.count({ index: INDEX });
  return count;
}

export async function upsertProduct(doc) {
  const { id, ...body } = doc;
  await es.index({ index: INDEX, id, document: body });
}

export async function deleteProduct(id) {
  await es.delete({ index: INDEX, id }, { ignore: [404] });
}

const SORT = {
  relevance: ['_score', { soldCount: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  'name-asc': [{ 'name.sort': 'asc' }],
  'name-desc': [{ 'name.sort': 'desc' }],
  'price-asc': [{ minPrice: 'asc' }],
  'price-desc': [{ minPrice: 'desc' }],
  'best-selling': [{ soldCount: 'desc' }],
  'top-rated': [{ avgRating: 'desc' }, { ratingCount: 'desc' }],
};

/** Full-text search with fuzzy matching; filters, sort and the brand facet run in ES. */
export async function search({
  q,
  category,
  tag,
  brand = [],
  minPrice,
  maxPrice,
  rating,
  sort,
  from = 0,
  size = 12,
}) {
  const filter = [{ term: { isActive: true } }];
  if (category) filter.push({ term: { category } });
  if (tag) filter.push({ term: { 'tags.keyword': tag } });
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.push({ range: { minPrice: { gte: minPrice, lte: maxPrice } } });
  }
  if (rating) filter.push({ range: { avgRating: { gte: rating } } });

  const must = q
    ? [
        {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ['name^4', 'brand^3', 'tags^2', 'categoryName^2', 'all'],
                  operator: 'and',
                  fuzziness: 'AUTO:5,8', // short tokens such as model numbers (4070) must match exactly
                  prefix_length: 1,
                },
              },
              { match_phrase_prefix: { name: { query: q, boost: 5 } } },
            ],
            minimum_should_match: 1,
          },
        },
      ]
    : [];

  const res = await es.search({
    index: INDEX,
    from,
    size,
    track_total_hits: true,
    query: { bool: { must, filter } },
    // Brand filter applied after aggregations so the facet still lists every matching brand.
    post_filter: brand.length ? { terms: { 'brand.keyword': brand } } : undefined,
    aggs: { brands: { terms: { field: 'brand.keyword', size: 100, order: { _key: 'asc' } } } },
    sort: SORT[sort] || SORT.relevance,
    _source: false,
  });

  return {
    ids: res.hits.hits.map((h) => h._id),
    total: res.hits.total.value,
    brands: res.aggregations.brands.buckets.map((b) => ({ name: b.key, count: b.doc_count })),
  };
}
