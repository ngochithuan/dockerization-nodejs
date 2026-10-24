=====================================================================
  DRINK MANAGEMENT APP - DOCKERIZED NODE.JS WEB APPLICATION
  Course   : Web Programming with Node.js (502070)
  Lecturer : Mai Van Manh
  Level    : 3 - Docker Compose + scaling/load balancing + RabbitMQ
                 decoupling + Docker Swarm orchestration
  Demo video link: demo/video-link.txt
=====================================================================

1. TEAM MEMBERS
---------------------------------------------------------------------
  - 523H0018 - Le Nguyen Cao Duy
  - 523H0102 - Ngo Chi Thuan
  - 523H0023 - Do Nguyen Tri Hao


2. REQUIREMENTS
---------------------------------------------------------------------
  - Docker Desktop (Docker Engine 24+ with Docker Compose v2)
  - Free host ports: 3000 (web app) and 15672 (RabbitMQ management UI)

  Node.js, npm, MongoDB and RabbitMQ do NOT need to be installed on the
  host. "npm ci" and the React build run inside the Dockerfiles.


3. QUICK START
---------------------------------------------------------------------
  Open a terminal in the project root (the folder that contains
  docker-compose.yml) and run:

      docker compose up -d

  The first run builds the images (about 2-4 minutes) and starts all
  services in the correct order. Then open:

      Web application        http://localhost:3000
      RabbitMQ management    http://localhost:15672   (drink / drink123)

  25 sample drinks are inserted automatically on the first run.
  The web application has no login (no admin account is needed).


4. ARCHITECTURE
---------------------------------------------------------------------

   Browser --:3000--> frontend (Nginx: React files + load balancer)
                          |  /api/*  round robin + failover
                          v
              backend x3 (Node.js / Express REST API)
                |                      |
                | read/write           | publish drink.created/updated/deleted
                v                      v
             MongoDB  <--- write ---  RabbitMQ queue "drink_events"
                ^                      |
                |                      | consume (asynchronous)
                +------- worker x2 <---+   (notification service)

  Service   Replicas  Host port  Role
  --------  --------  ---------  ------------------------------------------
  frontend  1         3000       React UI served by Nginx; reverse proxy and
                                 load balancer for /api -> backend replicas
  backend   3         -          Node.js + Express REST API; publishes events
  worker    2         -          Consumes events from RabbitMQ, writes the
                                 activity log to MongoDB
  rabbitmq  1         15672      Message broker (AMQP 5672 is internal only)
  mongo     1         -          MongoDB 7 database
  seed      -         -          One-shot job: inserts sample data if the
                                 database is empty, then exits

  Networks : frontend-net (frontend <-> backend)
             backend-net  (backend, worker <-> mongo; internal, no Internet)
             mq-net       (backend, worker <-> rabbitmq)
  Volumes  : mongo-data, rabbitmq-data (data survives restarts)
  Startup  : mongo + rabbitmq healthy -> seed completed -> backend healthy
             -> frontend. Workers start when mongo and rabbitmq are healthy.


5. BUILD THE IMAGES AND RUN THE CONTAINERS
---------------------------------------------------------------------
  Build the images only (drink-app/backend, drink-app/worker,
  drink-app/frontend):
      docker compose build

  Run all containers in the background:
      docker compose up -d

  Rebuild and restart after changing the source code:
      docker compose up -d --build

  Check status (all "healthy"/"Up"; seed shows "Exited (0)"):
      docker compose ps

  Follow the logs of a service:
      docker compose logs -f backend
      docker compose logs -f worker

  Stop the containers (data is kept):
      docker compose down

  Stop and delete all data (sample data is re-seeded on the next start):
      docker compose down -v


6. TEST THE APPLICATION
---------------------------------------------------------------------
  The user interface and the sample data are in Vietnamese. Commands
  below work in Command Prompt, Git Bash, Linux and macOS. In Windows
  PowerShell type "curl.exe" instead of "curl".

  a) Web UI - open http://localhost:3000
     - Browse, search, filter and sort the drink menu.
     - "Thêm đồ uống" (Add drink) button: create a drink.
     - Pencil / trash icons on a card: edit / delete a drink.
     - Queue button in the top bar (green lamp): opens the RabbitMQ event
       panel that shows the queue and the events processed by workers.

  b) REST API through Nginx:
      curl http://localhost:3000/api/health
      curl http://localhost:3000/api/drinks
      curl http://localhost:3000/api/activities
      curl -X POST http://localhost:3000/api/drinks -H "Content-Type: application/json" -d "{\"name\":\"Test drink\",\"category\":\"Tea\",\"price\":30000,\"size\":\"M\"}"

  c) Communication between services inside the Docker network:
      docker compose exec frontend wget -qO- http://backend:8080/api/health
      docker compose exec mongo mongosh -u admin -p admin123 --authenticationDatabase admin drink_db --eval "db.drinks.countDocuments()"

  d) Load balancing - run several times, the X-Upstream header shows a
     different backend replica each time:
      curl -sI http://localhost:3000/api/health
     PowerShell (9 requests at once):
      1..9 | % { (Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing).Headers['X-Upstream'] }
     Browser: DevTools > Network > "drinks" > Response Headers > X-Upstream

  e) Failover - stop one replica; the site keeps working because Nginx
     skips the stopped replica:
      docker stop drink-app-backend-1
      docker start drink-app-backend-1

  f) Scaling while running (Nginx finds new replicas within 5 seconds):
      docker compose up -d --scale backend=5
      docker compose up -d --scale backend=3

  g) Asynchronous decoupling with RabbitMQ:
      docker compose stop worker
     Add or edit drinks: the API still answers immediately and the
     messages wait in the queue (event panel, or
     http://localhost:15672 > Queues > drink_events).
      docker compose start worker
     The workers process every waiting message; nothing is lost. Each
     event is handled by exactly one of the 2 workers (competing
     consumers), see "worker <id>" in the event panel or:
      docker compose logs -f worker

  h) Reset the sample data (drops and re-creates the database):
      docker compose run --rm seed node seed.js


7. DOCKER SWARM (LEVEL 3)
---------------------------------------------------------------------
  File: deploy/docker-stack.yml (same services, managed by Swarm).

  Deploy:
      docker compose build
      docker compose down
      docker swarm init
      docker stack deploy --resolve-image never -c deploy/docker-stack.yml drink

  "--resolve-image never" uses the images built locally instead of
  looking for them on Docker Hub.

  Check:
      docker stack services drink
      docker service ps drink_backend
  Open http://localhost:3000 when every service shows its full replica
  count (e.g. 3/3). The first deploy can take 2-3 minutes: the backend
  restarts until MongoDB is ready (self-healing). After backend shows
  3/3, wait about 40 seconds: a replica is added to DNS only after its
  health check passes.

  Test what Swarm adds:
      docker kill <id of a drink_backend container>   (self-healing:
      docker service ps drink_backend                  a new task starts)
      docker service scale drink_backend=5             (scaling)
      docker service update --force drink_backend      (rolling update,
                                                       no downtime)
  Swarm also spreads port 3000 over 2 frontend replicas (routing mesh)
  and limits CPU/memory per service.

  Remove and go back to Docker Compose:
      docker stack rm drink
      docker swarm leave --force
      docker compose up -d


8. API ENDPOINTS
---------------------------------------------------------------------
  GET    /api/health        Service + database status, container hostname
  GET    /api/drinks        List all drinks
  GET    /api/drinks/:id    Get one drink
  POST   /api/drinks        Create a drink   (publishes drink.created)
  PUT    /api/drinks/:id    Update a drink   (publishes drink.updated)
  DELETE /api/drinks/:id    Delete a drink   (publishes drink.deleted)
  GET    /api/activities    RabbitMQ queue status + processed events

  Drink fields: name, category, price (required), size (S/M/L,
  required), description, image_url, status ("Còn" = available,
  "Không khả dụng" = unavailable).


9. ACCOUNTS AND CONFIGURATION
---------------------------------------------------------------------
  Web application:             no login
  MongoDB root account:        admin / admin123
  RabbitMQ management account: drink / drink123

  Optional: override the defaults in a ".env" file in the project root:
      APP_PORT=3000
      RABBITMQ_UI_PORT=15672
      MONGO_ROOT_USERNAME=admin
      MONGO_ROOT_PASSWORD=admin123
      RABBITMQ_USER=drink
      RABBITMQ_PASSWORD=drink123
      WORKER_DELAY_MS=2000
  Credentials only apply when the data volumes are first created; run
  "docker compose down -v" after changing them.


10. TROUBLESHOOTING
---------------------------------------------------------------------
  - "port is already allocated": port 3000 or 15672 is in use. Set
    APP_PORT / RABBITMQ_UI_PORT in .env, or stop the other program.
  - "502 Bad Gateway": the backend is still starting. Wait a few
    seconds and check "docker compose ps".
  - Queue button is red ("RabbitMQ mất kết nối" = RabbitMQ disconnected):
    RabbitMQ is still starting; the backend reconnects automatically.
  - Old data or changed passwords: "docker compose down -v", then
    "docker compose up -d".
  - Swarm service stuck in "Preparing": deploy with
    "--resolve-image never" (see section 7).


11. SUBMISSION CONTENTS
---------------------------------------------------------------------
  523H0023_523H0018_523H0102.pdf   Report
  demo/video-link.txt              Link to the demo video
  ReadMe.txt                       This file
  README.md                        Project overview
  docker-compose.yml               Level 1 + Level 2 (Docker Compose)
  deploy/docker-stack.yml          Level 3 (Docker Swarm)
  backend/                         Node.js + Express REST API
  worker/                          RabbitMQ consumer (notification service)
  frontend/                        React + Nginx (nginx.conf)

  node_modules folders are not included: every dependency is installed
  inside the Docker images (npm ci in each Dockerfile).
