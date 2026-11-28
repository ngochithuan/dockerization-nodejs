# Bonus — Elasticsearch product search

`search-service` owns an Elasticsearch 8 index (`products_v2`) and the catalogue's keyword search uses it.

- **Analysis**: custom `folding` analyzer (lowercase + ASCII folding), so `man hinh` finds "màn hình". All searchable fields (name, brand, tags, description, category name) are copied into an `all` field.
- **Query**: `multi_match` over `name^4, brand^3, tags^2, categoryName^2, all` with `operator: and` and **fuzzy matching** (`AUTO:5,8`, so typos in longer words are tolerated — `samsng` → Samsung — while model numbers such as `4070` must match exactly), plus a `match_phrase_prefix` boost for type-ahead.
- **Filters in ES**: category, tag, price range, minimum rating; the **brand** filter is a `post_filter` so the brand facet (terms aggregation) still lists every brand of the result set.
- **Sorting in ES**: relevance, newest, name A–Z / Z–A (keyword sub-field), price ↑/↓, best selling, top rated.
- **Sync**: product create/update/delete, new orders (sold counts) and new ratings publish `product.upserted` / `product.deleted` through RabbitMQ; search-service indexes them. On start-up it requests a full re-sync.
- **Fallback**: the api calls search-service with a 1.5 s timeout; if it is unavailable the same query runs on MongoDB, so the site never breaks.

## How to verify

1. Search for `samsng` or `man hinh` in the header search box — results appear; the catalogue header shows an **Elasticsearch** tag when ES served the query.
2. API: `curl "http://localhost:8080/api/v1/products?q=rtx%204070&sort=price-asc"` → `"engine":"elasticsearch"`.
3. Directly: `docker compose exec search wget -qO- "http://localhost:4000/search?q=ryzen"`.
4. Fallback: `docker compose stop search` and search again → results still appear (`"engine":"mongodb"`); `docker compose start search` restores ES.

_Screenshots: add them to this folder._
