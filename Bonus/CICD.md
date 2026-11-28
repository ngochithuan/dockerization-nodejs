# Bonus — CI/CD with GitHub Actions

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — runs on every push to any branch and on every pull request.

| Job                                                                                       | What it does                                                                                                                          |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Lint & format**                                                                         | `npm ci` at the root, `eslint .` (ESLint 9 flat config for Node + React) and `prettier --check .`                                     |
| **Test** (matrix: `services/api`, `services/notification`, `services/search`, `frontend`) | `npm ci` + `npm test` in each package; the frontend job also runs `vite build`                                                        |
| **Docker image** (matrix: api, notification, search, frontend)                            | Builds every service's multi-stage Dockerfile with Buildx (layer cache in GitHub Actions cache). Runs only after lint and tests pass. |
| **Compose config**                                                                        | `docker compose config` validates `docker-compose.yml`                                                                                |

Tests:

- `services/api/test/app.test.js` — health endpoint + `X-Served-By`, shared error format, NoSQL-operator rejection.
- `services/api/test/pricing.test.js` — VAT, shipping rule, percentage discount, loyalty-point caps.
- `services/notification/test/templates.test.js` — order e-mail contents, set-password link, HTML escaping.

## How to verify

1. Open the repository on GitHub → **Actions** → workflow **CI**.
2. Every commit shows the four job groups; a failing lint/test blocks the Docker build jobs.
3. The status badge at the top of `README.md` reflects the latest run.

_Screenshots of the Actions runs: add them to this folder._
