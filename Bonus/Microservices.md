# Bonus — Microservices architecture with asynchronous messaging

Besides the frontend and the databases, the system runs **three application services** (plus a one-shot seed job), each in its own container with its own `package.json` and Dockerfile. They never share code at runtime and do not call each other synchronously for these flows — they communicate through **RabbitMQ** (topic exchange `pcshop.events`).

| Service        | Publishes                                                                                                                     | Consumes (queue)                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `api` (×3)     | `user.registered`, `password.reset_requested`, `order.created`, `order.status_changed`, `product.upserted`, `product.deleted` | `search.reindex_requested` (`api.search-reindex`, competing consumers: one replica handles each message)                      |
| `notification` | —                                                                                                                             | `user.registered`, `password.reset_requested`, `order.created`, `order.status_changed` (`notification.events`) → sends e-mail |
| `search`       | `search.reindex_requested` (on start-up)                                                                                      | `product.upserted`, `product.deleted` (`search.events`) → Elasticsearch index                                                 |

Reliability:

- Durable exchange and queues, persistent messages, publisher confirms (`waitForConfirms`).
- Manual acknowledgements; `prefetch` limits in-flight messages.
- **Retry with delay**: a failed message is dead-lettered to `<queue>.retry` (TTL 5–10 s) and routed back to the original queue; after 4–5 attempts it is parked in `<queue>.dead` for inspection.
- Services reconnect to RabbitMQ with back-off on start-up and exit (Docker restarts them) if the connection drops.

Decoupling in practice:

- Placing an order never waits for SMTP: the api commits the transaction, publishes `order.created` and responds. If notification-service is stopped, the e-mails are delivered when it comes back.
- The search index is rebuilt automatically: search-service publishes `search.reindex_requested` on start-up and the api re-publishes the catalogue.

## How to verify

1. Open the RabbitMQ management UI: http://localhost:15672 (user `pcshop`, password `pcshop`) → **Queues**: `notification.events`, `notification.events.retry`, `notification.events.dead`, `search.events`, `search.events.retry`, `search.events.dead`, `api.search-reindex`.
2. `docker compose stop notification`, then place an order → `notification.events` shows 1 ready message. `docker compose start notification` → the message is consumed and the e-mail is sent (`docker compose logs notification`).
3. As admin, edit a product name → search for the new name in the shop: the change arrives through `product.upserted`.
4. `docker compose logs api | grep reindex` shows the catalogue re-published when search-service starts.

_Screenshots: add them to this folder._
