# Circuit — computers & components e-commerce

[![CI](https://github.com/Dsoul-DiSolve/dockerization-nodejs/actions/workflows/ci.yml/badge.svg?branch=feature%2Ffinal-project)](https://github.com/Dsoul-DiSolve/dockerization-nodejs/actions/workflows/ci.yml)

Final project for **Web Programming with Node.js (502070)**. A full e-commerce site that sells **only computers and computer components** (laptops, desktop PCs, monitors, CPUs, GPUs, RAM, storage, mainboards, PSUs, cases). JavaScript only — Express 5 + MongoDB on the back end, React (Vite) on the front end — split into microservices and scaled horizontally behind nginx.

```bash
docker compose up -d        # the only command needed
# → http://localhost:8080   admin@circuit.local / Admin@123 · customer@circuit.local / Customer@123
```

See [`Readme.txt`](Readme.txt) for the grader's guide (accounts, discount codes, guest checkout, scaling checks).

## Architecture

```
                         ┌───────────────────────── docker compose ─────────────────────────┐
 browser ──► nginx :8080 │  /            → frontend (React build served by nginx)          │
   (load balancer)       │  /api/*       → api × 3 replicas (round-robin, retry on failure)│
                         │  /socket.io/* → api replicas (websocket, Redis adapter)          │
                         │  /uploads/*   → shared "uploads" volume                          │
                         │                                                                  │
                         │  api ──► MongoDB (single-node replica set → transactions)        │
                         │      ──► Redis (rate limits, socket.io adapter, cache, ban check)│
                         │      ──► search-service (HTTP, falls back to MongoDB)            │
                         │      ──► RabbitMQ  pcshop.events (topic exchange)                │
                         │            ├─► notification-service → Gmail SMTP                 │
                         │            ├─► search-service → Elasticsearch                    │
                         │            └─► api (search.reindex_requested, competing consumer)│
                         │  seed (one-shot) → MongoDB + uploads volume, before the api      │
                         └──────────────────────────────────────────────────────────────────┘
```

| Service                                       | Path                    | Role                                                                                                                                |
| --------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `nginx`                                       | `infra/nginx`           | Only exposed entry point (8080). Round-robin over `api` replicas, re-resolves Docker DNS every 5 s so `--scale` works live.         |
| `frontend`                                    | `frontend/`             | React 18 + Vite, React Router, TanStack Query, Chart.js, socket.io-client. Built in a multi-stage image and served as static files. |
| `api` ×3                                      | `services/api`          | Express 5, Mongoose, zod, helmet, express-rate-limit + Redis store, multer, socket.io + Redis adapter, amqplib. Stateless.          |
| `notification`                                | `services/notification` | Consumes events, renders HTML e-mails, sends via nodemailer (Gmail SMTP).                                                           |
| `search`                                      | `services/search`       | Owns the Elasticsearch index; consumes product events; serves `/search`.                                                            |
| `seed`                                        | `seed/`                 | Idempotent seeder (runs once, only on an empty DB) + generated product images.                                                      |
| `mongo`, `redis`, `rabbitmq`, `elasticsearch` | —                       | Infrastructure with health checks; services wait with `depends_on: service_healthy`.                                                |

### Stateless api (why it scales)

- Auth: JWT in an `httpOnly`, `SameSite=Lax` cookie. Role and ban status are re-checked on each request (cached 60 s in Redis, invalidated immediately on ban).
- Carts live in MongoDB (guest cart keyed by a `cid` cookie, merged into the user cart at login).
- Google OAuth `state` is stored in a short-lived cookie, not in server memory.
- Rate-limit counters, socket.io fan-out and the small JSON cache are in Redis.
- Uploaded images go to a named volume shared by all replicas and served by nginx.
- Every response carries `X-Served-By: <container id>`; `GET /api/health` returns `{ status, instance, checks }`.

## Scaling evidence

```bash
node scripts/scaling-demo.js 300 20     # distribution of 300 requests across replicas
docker stop pcshop-api-2                # site keeps working (nginx retries the next replica)
docker compose up -d --scale api=5      # new replicas join the rotation within ~5 s
```

Sample output of the demo script:

```
120 requests to http://localhost:8080/api/health in 437 ms (275 req/s)
Failed: 0
Instance (container id)   Requests   Share
0d2417774b02                     40    33%  ██████████████████████████████
3fac2b1fc483                     40    33%  ██████████████████████████████
c2be959a80ea                     40    33%  ██████████████████████████████
3 replica(s) served traffic.
```

## Environment variables

All values are set in `docker-compose.yml` (`x-app-env`). Secrets are read from a `.env` file next to it (auto-loaded by Compose, git-ignored):

| Variable                                                        | Purpose                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth (redirect URI `http://localhost:8080/api/auth/google/callback`). Empty → Google button hidden. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Gmail SMTP with an App Password. Empty → e-mails are logged instead of sent.                                |
| `JWT_SECRET`                                                    | Optional override of the JWT signing key.                                                                   |
| `HTTP_PORT`, `RABBITMQ_UI_PORT`                                 | Optional host ports (default 8080 / 15672).                                                                 |

Fixed in compose: `MONGO_URI`, `REDIS_URL`, `RABBITMQ_URL`, `ELASTICSEARCH_URL`, `SEARCH_SERVICE_URL`, `BASE_URL=http://localhost:8080`, `UPLOADS_DIR`.

## API overview (`/api/v1`)

Errors always use `{ "error": { "code", "message", "details" } }`. All input is validated with zod; keys starting with `$` or containing `.` are rejected (NoSQL-injection guard).

| Area              | Endpoints                                                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog           | `GET /categories`, `GET /home`, `GET /products?q&category&tag&brand&minPrice&maxPrice&rating&sort&page`, `GET /products/:slug`                                                                                                                        |
| Reviews           | `GET/POST /products/:id/reviews` (comment: anyone; stars: login) — pushed live via socket.io room `product:<id>`                                                                                                                                      |
| Auth              | `POST /auth/register` (email, full name, address only), `/auth/login`, `/auth/logout`, `GET /auth/me`, `/auth/forgot-password`, `GET/POST /auth/reset-password`, `/auth/change-password`; Google: `GET /api/auth/google`, `/api/auth/google/callback` |
| Account           | `GET/PATCH /account`, `GET/POST/PUT/DELETE /account/addresses[/:id]`, `POST /account/addresses/:id/default`                                                                                                                                           |
| Cart              | `GET /cart`, `POST/PATCH /cart/items`, `DELETE /cart/items/:productId/:variantId`                                                                                                                                                                     |
| Checkout & orders | `POST /checkout/quote`, `POST /orders` (guest or logged in), `GET /orders`, `GET /orders/:orderNumber`                                                                                                                                                |
| Admin             | `GET /admin/dashboard`, `GET /admin/analytics?period=year                                                                                                                                                                                             | quarter | month | week | custom&from&to`, products / categories / uploads CRUD, users (list, detail, edit, ban), orders (list with time filters, detail, status), discounts (list, create) |

## Key implementation notes and decisions

- **Order placement is one MongoDB transaction**: per-variant stock decrement (`stock >= qty` condition), discount use (`usedCount < usageLimit`), loyalty points, sold counters, order with `statusHistory`, cart clearing. `order.created` is published to RabbitMQ after commit.
- **Discounts** are a percentage of the subtotal (one type system-wide), 5 alphanumeric characters, no expiry, limit 1–10.
- **Pricing**: VAT 10% on the discounted subtotal; shipping 30,000đ, free from 5,000,000đ; loyalty points = `floor(total × 10% / 1000)` where `total` is the amount paid; 1 point = 1,000đ.
- **Profit** in the advanced dashboard = Σ (unit price − unit cost) × qty − discounts − points redeemed (cancelled orders excluded). Buckets use `$dateTrunc` in `Asia/Ho_Chi_Minh`.
- **Admin** contains only the features in the specification (dashboards, products/categories/inventory, users, orders, discount list + create).
- **Libraries**: `bcryptjs` (pure-JS bcrypt, no native build in Alpine images); Google OAuth is implemented directly with the authorization-code flow (state in a cookie) instead of passport, to keep the api stateless.
- **Seed data**: 100 products × 2–4 variants, 3 generated SVG images each, ~33 users, ~630 orders over 2+ years, ~480 ratings and ~370 comments, 6 discount codes.

## Development

```bash
npm ci && npm run lint && npm run format:check     # root tooling (ESLint 9 + Prettier)
cd services/api && npm ci && npm test              # node:test + supertest
cd services/notification && npm ci && npm test
cd frontend && npm ci && npm run dev               # Vite on :5173, proxies to the stack on :8080
```

## Bonus features

| Bonus                        | Evidence                                           |
| ---------------------------- | -------------------------------------------------- |
| CI/CD (GitHub Actions)       | [`Bonus/CICD.md`](Bonus/CICD.md)                   |
| Microservices with RabbitMQ  | [`Bonus/Microservices.md`](Bonus/Microservices.md) |
| Elasticsearch product search | [`Bonus/Elasticsearch.md`](Bonus/Elasticsearch.md) |
