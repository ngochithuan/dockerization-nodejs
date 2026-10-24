# Frontend – Drink Menu

React + TypeScript (Vite) user interface for managing drinks, using the REST API of `backend/`.

| Action | Endpoint |
| --- | --- |
| List | `GET /api/drinks` |
| Details | `GET /api/drinks/:id` |
| Create | `POST /api/drinks` |
| Update | `PUT /api/drinks/:id` |
| Delete | `DELETE /api/drinks/:id` |

## Run locally without Docker

```bash
npm install
npm run dev      # http://localhost:5173
```

The frontend calls `/api` on the same origin; the Vite proxy forwards it to the backend (default `http://localhost:8080`).

In Docker, the app is built in the first stage of the `Dockerfile` and served by Nginx (`nginx.conf`), which also load-balances `/api` across the backend replicas.

## Environment variables

| Variable | Used by | Default |
| --- | --- | --- |
| `API_PROXY_TARGET` | `npm run dev` / `npm run preview`: backend address that `/api` is proxied to | `http://localhost:8080` |
| `VITE_API_URL` | Build time: base URL the browser uses for the API (e.g. `http://localhost:8080/api`) | `/api` |

## Build

```bash
npm run build    # output: dist/ (static files)
```
