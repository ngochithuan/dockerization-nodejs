=====================================================================
  DRINK MANAGEMENT APP - DOCKERIZED NODE.JS WEB APPLICATION
  Course : Web Programming with Node.js (502070)
  Level  : 1 - Docker Compose (front-end + back-end + database)
=====================================================================

1. TEAM MEMBERS
---------------------------------------------------------------------
  - <Student ID> - <Full name>
  - <Student ID> - <Full name>
  - <Student ID> - <Full name>


2. REQUIREMENTS
---------------------------------------------------------------------
  - Docker Desktop (Docker Engine 24+ with Docker Compose v2)
  - Free host port: 3000
  No Node.js / npm / MongoDB installation is needed on the host machine.
  All dependencies are installed inside the Docker images.


3. QUICK START
---------------------------------------------------------------------
  Open a terminal in the project root (the folder that contains
  docker-compose.yml) and run:

      docker compose up -d

  The first run builds the images (about 1-3 minutes), then starts
  all services in the correct order. Open:

      http://localhost:3000

  Sample data (25 drinks) is inserted automatically on the first run.


4. SERVICES
---------------------------------------------------------------------
  Service    Image / Build         Port (host:container)  Role
  ---------  --------------------  ---------------------  -----------------------------
  frontend   ./frontend            3000:80                React UI served by Nginx,
                                                          reverse proxy /api -> backend
  backend    ./backend             (internal) 8080        Node.js + Express REST API
  mongo      mongo:7.0             (internal) 27017       MongoDB database
  seed       ./backend             -                      One-shot job: inserts sample
                                                          data if the DB is empty, then exits

  Networks:
    frontend-net : frontend <-> backend
    backend-net  : backend  <-> mongo   (internal, not reachable from frontend
                                         or from the host)
  Volume:
    mongo-data   : persists MongoDB data across restarts

  Startup order (enforced by depends_on + healthchecks):
    mongo (healthy) -> seed (completed) -> backend (healthy) -> frontend


5. BUILD AND RUN STEP BY STEP
---------------------------------------------------------------------
  Build images only:
      docker compose build

  Start containers in the background:
      docker compose up -d

  Rebuild after changing source code:
      docker compose up -d --build

  Check status (all services should be "healthy"; seed shows "Exited (0)"):
      docker compose ps

  View logs:
      docker compose logs -f backend
      docker compose logs seed

  Stop containers (data is kept):
      docker compose down

  Stop and DELETE all data (fresh start, sample data is re-seeded):
      docker compose down -v


6. TESTING THE APPLICATION
---------------------------------------------------------------------
  a) Web UI: open http://localhost:3000 and try to list, search, add,
     edit and delete drinks.

  b) REST API (through the Nginx reverse proxy):
      curl http://localhost:3000/api/health
      curl http://localhost:3000/api/drinks

      curl -X POST http://localhost:3000/api/drinks ^
        -H "Content-Type: application/json" ^
        -d "{\"name\":\"Test drink\",\"category\":\"Tea\",\"price\":30000,\"size\":\"M\"}"

     (On Linux/macOS replace ^ with \ at the end of each line.)

  c) Inter-service communication inside the Docker network:
      docker compose exec backend wget -qO- http://localhost:8080/api/health
      docker compose exec frontend wget -qO- http://backend:8080/api/health

  d) Database:
      docker compose exec mongo mongosh -u admin -p admin123 ^
        --authenticationDatabase admin drink_db --eval "db.drinks.countDocuments()"

  e) Reset sample data manually (drops and re-creates the database):
      docker compose run --rm seed node seed.js


7. API ENDPOINTS
---------------------------------------------------------------------
  GET    /api/health        Service + database status, container hostname
  GET    /api/drinks        List all drinks
  GET    /api/drinks/:id    Get one drink
  POST   /api/drinks        Create a drink
  PUT    /api/drinks/:id    Update a drink
  DELETE /api/drinks/:id    Delete a drink


8. ACCOUNTS / CONFIGURATION
---------------------------------------------------------------------
  The web application has no login.

  MongoDB root account (default):
      username: admin
      password: admin123

  Optional overrides: create a file named ".env" in the project root:
      APP_PORT=3000
      MONGO_ROOT_USERNAME=admin
      MONGO_ROOT_PASSWORD=admin123
  Note: MongoDB credentials are only applied when the mongo-data volume
  is created for the first time. Run "docker compose down -v" after
  changing them.


9. TROUBLESHOOTING
---------------------------------------------------------------------
  - "port is already allocated": port 3000 is in use. Set APP_PORT=3001
    in .env (or stop the other program) and run docker compose up -d again.
  - Page shows "502 Bad Gateway": the backend is still starting. Wait a
    few seconds and check "docker compose ps".
  - Wrong/old data or changed DB password: run "docker compose down -v"
    then "docker compose up -d".
