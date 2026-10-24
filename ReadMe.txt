  =====================================================================
  DRINK MANAGEMENT APP - DOCKERIZED NODE.JS WEB APPLICATION
  Course : Web Programming with Node.js (502070)
  Level  : 3 - Docker Compose + scaling/load balancing + RabbitMQ
               decoupling + Docker Swarm orchestration
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
  No Node.js / npm / MongoDB / RabbitMQ installation is needed on the
  host machine. All dependencies are installed inside the Docker images.


3. QUICK START (LEVEL 1 + LEVEL 2)
---------------------------------------------------------------------
  Open a terminal in the project root (the folder that contains
  docker-compose.yml) and run:

      docker compose up -d

  The first run builds the images (about 2-4 minutes), then starts all
  services in the correct order. Open:

      Web application        http://localhost:3000
      RabbitMQ management    http://localhost:15672   (drink / drink123)

  Sample data (25 drinks) is inserted automatically on the first run.


4. ARCHITECTURE AND SERVICES
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
                |                      | consume (async)
                +------- worker x2 <---+   (notification service)

  Service    Image / Build        Replicas  Port (host:container)  Role
  ---------  -------------------  --------  ---------------------  --------------------------------
  frontend   ./frontend           1         3000:80                React UI served by Nginx;
                                                                   reverse proxy + load balancer
                                                                   for /api -> backend replicas
  backend    ./backend            3         (internal) 8080        Node.js + Express REST API;
                                                                   publishes drink events
  worker     ./worker             2         -                      Notification service: consumes
                                                                   events from RabbitMQ, writes the
                                                                   activity log to MongoDB
  rabbitmq   rabbitmq:3-mgmt      1         15672:15672            Message broker (AMQP 5672 is
                                                                   internal only)
  mongo      mongo:7.0            1         (internal) 27017       MongoDB database
  seed       ./backend            -         -                      One-shot job: inserts sample data
                                                                   if the DB is empty, then exits

  Networks:
    frontend-net : frontend <-> backend
    backend-net  : backend, worker <-> mongo   (internal: no Internet,
                                                not reachable from frontend)
    mq-net       : backend, worker <-> rabbitmq
  Volumes:
    mongo-data, rabbitmq-data : data survives container restarts

  Startup order (depends_on + healthchecks):
    mongo, rabbitmq (healthy) -> seed (completed) -> backend (healthy)
    -> frontend; worker starts when mongo and rabbitmq are healthy.

  How a request flows:
    1. React calls /api/drinks (same origin, http://localhost:3000).
    2. Nginx sends it to ONE backend replica (round robin). Nginx asks
       Docker DNS every 5 s which IPs "backend" has, so scaling needs
       no restart. The response header X-Upstream shows which replica
       served the request.
    3. On create/update/delete the backend saves to MongoDB, publishes
       an event to RabbitMQ and answers immediately (it does not wait).
    4. A worker takes the event (each event goes to one worker), works
       for ~2 s (simulated staff notification) and writes an activity
       log entry. The UI panel "Hang doi su kien" shows the queue.


5. BUILD AND RUN STEP BY STEP
---------------------------------------------------------------------
  Build images only:
      docker compose build

  Start containers in the background:
      docker compose up -d

  Rebuild after changing source code:
      docker compose up -d --build

  Check status (services "healthy"/"Up"; seed shows "Exited (0)"):
      docker compose ps

  View logs:
      docker compose logs -f backend
      docker compose logs -f worker

  Stop containers (data is kept):
      docker compose down

  Stop and DELETE all data (fresh start, sample data is re-seeded):
      docker compose down -v


6. TESTING THE APPLICATION
---------------------------------------------------------------------
  a) Web UI: open http://localhost:3000 and list, search, filter, add,
     edit and delete drinks. Click the queue button in the top bar to
     open the event panel.

  b) REST API (through Nginx):
      curl http://localhost:3000/api/health
      curl http://localhost:3000/api/drinks
      curl http://localhost:3000/api/activities

      curl -X POST http://localhost:3000/api/drinks ^
        -H "Content-Type: application/json" ^
        -d "{\"name\":\"Test drink\",\"category\":\"Tea\",\"price\":30000,\"size\":\"M\"}"

     (On Linux/macOS replace ^ with \ at the end of each line.)

  c) Inter-service communication inside the Docker network:
      docker compose exec frontend wget -qO- http://backend:8080/api/health
      docker compose exec backend wget -qO- http://localhost:8080/api/health

  d) Database:
      docker compose exec mongo mongosh -u admin -p admin123 ^
        --authenticationDatabase admin drink_db --eval "db.drinks.countDocuments()"

  e) Reset sample data manually (drops and re-creates the database):
      docker compose run --rm seed node seed.js


7. DEMO SCENARIOS (LEVEL 2)
---------------------------------------------------------------------
  (PowerShell commands; run them in the project root)

  a) Load balancing - requests are spread over the 3 backend replicas:
      1..9 | % { (Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing).Headers['X-Upstream'] }
     Browser: DevTools > Network > request "drinks" > Response Headers
     > X-Upstream changes on every reload.

  b) Fault tolerance - stop one replica while using the site:
      docker stop drink-app-backend-1
     The site keeps working: Nginx skips the dead replica (failover).
      docker start drink-app-backend-1

  c) Scaling on the fly (Nginx picks up new replicas within 5 s):
      docker compose up -d --scale backend=5
      docker compose up -d --scale backend=3

  d) Asynchronous decoupling with RabbitMQ:
      docker compose stop worker
     Add or edit drinks in the UI: the API still answers immediately,
     and the event panel shows messages waiting in the queue
     (also visible at http://localhost:15672 > Queues > drink_events).
      docker compose start worker
     The workers process every waiting message; nothing is lost.

  e) Competing consumers - each event is handled by exactly one of the
     2 workers (see "worker <id>" in the event panel or):
      docker compose logs -f worker


8. DOCKER SWARM (LEVEL 3)
---------------------------------------------------------------------
  File: deploy/docker-stack.yml (same services, managed by Swarm).

  Deploy:
      docker compose build
      docker compose down
      docker swarm init
      docker stack deploy --resolve-image never -c deploy/docker-stack.yml drink

  (--resolve-image never: use the images built locally instead of
   looking them up on Docker Hub.)

  Check:
      docker stack services drink
      docker service ps drink_backend
     Open http://localhost:3000 when all replicas show e.g. 3/3.
     The first deploy can take 2-3 minutes: mongo may stay "Preparing"
     for a while and the backend restarts until MongoDB is ready
     (self-healing). After backend shows 3/3, wait about 10 seconds
     for Nginx to pick up the new replica IPs.

  What Swarm adds compared to Compose:
    - Self-healing: a crashed or killed container is replaced
      automatically.
          docker kill <id of a drink_backend container>
          docker service ps drink_backend      (a new task starts)
    - Scaling with one command:
          docker service scale drink_backend=5
    - Rolling update without downtime (one replica at a time, new
      replica starts before the old one stops, auto rollback on
      failure):
          docker service update --force drink_backend
    - Routing mesh: port 3000 is published by Swarm and spread over the
      2 frontend replicas.
    - CPU/memory limits per service.

  Remove:
      docker stack rm drink
      docker swarm leave --force
      docker compose up -d          (back to the Compose setup)


9. API ENDPOINTS
---------------------------------------------------------------------
  GET    /api/health        Service + database status, container hostname
  GET    /api/drinks        List all drinks
  GET    /api/drinks/:id    Get one drink
  POST   /api/drinks        Create a drink        (publishes drink.created)
  PUT    /api/drinks/:id    Update a drink        (publishes drink.updated)
  DELETE /api/drinks/:id    Delete a drink        (publishes drink.deleted)
  GET    /api/activities    RabbitMQ queue status + events processed by
                            the workers


10. ACCOUNTS / CONFIGURATION
---------------------------------------------------------------------
  The web application has no login.

  MongoDB root account:        admin / admin123
  RabbitMQ management account: drink / drink123

  Optional overrides: create a file named ".env" in the project root:
      APP_PORT=3000
      RABBITMQ_UI_PORT=15672
      MONGO_ROOT_USERNAME=admin
      MONGO_ROOT_PASSWORD=admin123
      RABBITMQ_USER=drink
      RABBITMQ_PASSWORD=drink123
      WORKER_DELAY_MS=2000
  Note: credentials are only applied when the data volumes are created
  for the first time. Run "docker compose down -v" after changing them.


11. TROUBLESHOOTING
---------------------------------------------------------------------
  - "port is already allocated": port 3000 or 15672 is in use. Set
    APP_PORT / RABBITMQ_UI_PORT in .env (or stop the other program).
  - Page shows "502 Bad Gateway": the backend is still starting. Wait a
    few seconds and check "docker compose ps".
  - Event panel shows "RabbitMQ mat ket noi": RabbitMQ is still
    starting; the backend reconnects automatically.
  - Wrong/old data or changed passwords: run "docker compose down -v"
    then "docker compose up -d".
  - Swarm service stuck in "Preparing": deploy with
    "--resolve-image never" (see section 8).
