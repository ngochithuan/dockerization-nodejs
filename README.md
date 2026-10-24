# Drink Management App – Dockerized Node.js Web Application

Mid-term essay for **Web Programming with Node.js (502070)**. Lecturer: Mai Van Manh.

A drink menu manager for a small café: staff can list, search, add, edit and delete drinks. Each change is published to RabbitMQ, and a separate notification service tells the bar (simulated) asynchronously. The whole system runs with a single command:

```bash
docker compose up -d
```

Then open http://localhost:3000. Step-by-step instructions for building, running and testing are in [ReadMe.txt](ReadMe.txt).

## Team

| Student ID | Name |
| --- | --- |
| 523H0018 | Le Nguyen Cao Duy |
| 523H0102 | Ngo Chi Thuan |
| 523H0023 | Do Nguyen Tri Hao |

## Requirement levels covered

| Level | Requirement | How this project meets it |
| --- | --- | --- |
| 1 | Front-end, back-end and database in Docker Compose | React + Nginx, Node.js/Express, MongoDB, started by `docker compose up -d` |
| 1 | Services share a Docker network and communicate | Nginx → backend on `frontend-net`; backend/worker → MongoDB on `backend-net`; backend/worker → RabbitMQ on `mq-net` |
| 1 | No manual `npm install` | `npm ci` and the React build run inside the Dockerfiles; a `seed` job inserts sample data |
| 2 | Replicate a service with load balancing | 3 backend replicas; Nginx balances `/api` requests round robin, retries on another replica if one fails, and finds new replicas through Docker DNS |
| 2 | Decouple services through a message broker | Backend publishes `drink.created/updated/deleted` to RabbitMQ; 2 worker replicas consume them asynchronously |
| 3 | Container orchestration | `deploy/docker-stack.yml` for Docker Swarm: self-healing, rolling updates with rollback, routing mesh, resource limits |

## Architecture

```text
Browser ──:3000──▶ frontend (Nginx: React static files + load balancer)
                        │  /api/*  round robin + failover
                        ▼
              backend ×3 (Node.js / Express REST API)
                │                       │
                │ read/write            │ publish drink.* events
                ▼                       ▼
             MongoDB ◀──── write ──── RabbitMQ queue "drink_events"
                                        │ consume (asynchronous)
                                        ▼
                              worker ×2 (notification service)
```

| Service | Image | Replicas | Role |
| --- | --- | --- | --- |
| `frontend` | built from `./frontend` (Node build stage → `nginx:1.29-alpine`) | 1 (2 in Swarm) | Serves the React app; reverse proxy and load balancer for `/api` |
| `backend` | built from `./backend` (`node:22-alpine`) | 3 | REST API; saves to MongoDB and publishes events |
| `worker` | built from `./worker` (`node:22-alpine`) | 2 | Consumes events, writes the activity log |
| `rabbitmq` | `rabbitmq:3-management` | 1 | Message broker, management UI on port 15672 |
| `mongo` | `mongo:7.0` | 1 | Database |
| `seed` | same image as `backend` | one-shot | Inserts 25 sample drinks if the database is empty |

Design points:

- **Startup order** uses `depends_on` with health checks: MongoDB and RabbitMQ healthy → seed finished → backend healthy → frontend.
- **Network isolation**: `backend-net` is `internal`, so the database has no Internet access and cannot be reached from the frontend.
- **Graceful shutdown**: on `SIGTERM` a backend replica keeps serving for a few seconds before closing, so Nginx stops sending it traffic and users see no errors during scaling or rolling updates.
- **Reliable messaging**: the queue and messages are durable. Workers acknowledge a message only after processing it, so messages wait in the queue while workers are down and none are lost.
- **Security**: the Node.js containers run as the non-root `node` user, and only ports 3000 and 15672 are published to the host.

## Tech stack

- **Front-end**: React 19, TypeScript, Vite, Nginx
- **Back-end**: Node.js 22, Express 5, Mongoose 9, amqplib
- **Infrastructure**: Docker, Docker Compose, Docker Swarm, MongoDB 7, RabbitMQ 3

## Project structure

```text
.
├── docker-compose.yml        # Level 1 + 2: all services, networks, volumes
├── deploy/
│   └── docker-stack.yml      # Level 3: Docker Swarm stack
├── backend/                  # Express REST API (+ seed.js)
│   ├── Dockerfile
│   ├── server.js
│   └── src/                  # routes, controllers, models, config (MongoDB, RabbitMQ)
├── worker/                   # RabbitMQ consumer (notification service)
│   ├── Dockerfile
│   └── worker.js
├── frontend/                 # React + TypeScript UI
│   ├── Dockerfile            # multi-stage: Node build -> Nginx
│   ├── nginx.conf            # static files, reverse proxy, load balancing
│   └── src/
├── demo/video-link.txt       # link to the demo video
└── ReadMe.txt                # build, run and test instructions
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Service and database status, hostname of the replica that answered |
| GET | `/api/drinks` | List all drinks |
| GET | `/api/drinks/:id` | Get one drink |
| POST | `/api/drinks` | Create a drink (publishes `drink.created`) |
| PUT | `/api/drinks/:id` | Update a drink (publishes `drink.updated`) |
| DELETE | `/api/drinks/:id` | Delete a drink (publishes `drink.deleted`) |
| GET | `/api/activities` | RabbitMQ queue status and events processed by the workers |

## Accounts

| What | Account |
| --- | --- |
| Web application | No login |
| MongoDB root | `admin` / `admin123` |
| RabbitMQ management (http://localhost:15672) | `drink` / `drink123` |

## Quick commands

```bash
docker compose up -d                       # build (first run) and start everything
docker compose ps                          # status
docker compose up -d --scale backend=5     # scale the backend
docker compose logs -f worker              # watch the workers process events
docker compose down                        # stop (data is kept)
docker compose down -v                     # stop and delete all data
```

Docker Swarm deployment, test scenarios (load balancing, failover, scaling, asynchronous messaging) and troubleshooting are described in [ReadMe.txt](ReadMe.txt).
