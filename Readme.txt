CIRCUIT — E-COMMERCE WEBSITE FOR COMPUTERS & COMPUTER COMPONENTS
Final project — Web Programming with Node.js (502070)
=====================================================================

1. REQUIREMENTS
---------------
- Docker Desktop (Docker Engine + Docker Compose v2). Nothing else: no Node.js, no npm install.
- Free host port 8080 (website) and 15672 (RabbitMQ management UI, optional).
- About 4 GB of RAM available to Docker (Elasticsearch uses 512 MB heap).

2. RUN (single command)
-----------------------
Open a terminal in this folder (the one that contains docker-compose.yml) and run:

    docker compose up -d

The first start builds the images and downloads MongoDB, Redis, RabbitMQ and
Elasticsearch, so it takes a few minutes. Data is seeded automatically the first time
(the "seed" container runs once, then exits). When `docker compose ps` shows the
three api containers as "healthy", open:

    http://localhost:8080

Reset everything to the initial demo data:   docker compose down -v && docker compose up -d
If port 8080 is busy you can use another:     HTTP_PORT=8088 docker compose up -d
(Google login only works on port 8080 because of the registered redirect URI.)

3. ACCOUNTS WITH PRE-LOADED DATA
--------------------------------
Administrator (the only admin):
    Email:    admin@circuit.local
    Password: Admin@123
    -> after login you are taken to http://localhost:8080/admin

Customer (orders on several pages, 3 saved addresses, 1,500 loyalty points):
    Email:    customer@circuit.local
    Password: Customer@123

Other seeded customers (password Password@123) are listed in Admin > Người dùng.
Some customers were created by guest checkout and have no password yet; one account
(google.user@circuit.local) is a Google-style account without a password; one account
is banned (to demonstrate ban/unban).

Note: seeded e-mail addresses end in @circuit.local and cannot receive mail. To see the
e-mails (order confirmation, set password, password recovery) use your own address,
e.g. with guest checkout or the "Quên mật khẩu" (forgot password) page.

4. DISCOUNT CODES
-----------------
Usable:     NEW10 (10%, 0/10 used)   XMAS6 (6%, 0/3)   TECH5 (5%, 3/10)   BUILD (12%, 4/10)
Used up:    PCVIP (15%, 5/5)         SUMMR (20%, 2/2)  -> shown as invalid at checkout
Codes are 5 alphanumeric characters, created by the admin only, never expire, and have
a usage limit of 1-10 chosen by the admin.

5. GUEST CHECKOUT (purchase without logging in)
-----------------------------------------------
1. Add any product to the cart (no login), open the cart, click "Tiến hành thanh toán".
2. Step 1: enter e-mail, full name, phone and address. Step 2: COD or simulated card
   (test card 4242 4242 4242 4242, any future expiry, any CVC). Step 3: review, enter a
   discount code (validity and the amount saved are shown before paying), place order.
3. The success page shows all order information. A confirmation e-mail is sent.
4. If the e-mail had no account, one is created automatically and the confirmation
   e-mail contains a "set password" link. After setting the password and logging in,
   the customer sees the order in "Đơn hàng của tôi". If the e-mail already had an
   account, the order is linked to it.

6. HORIZONTAL SCALING — HOW TO VERIFY
-------------------------------------
The api runs as 3 replicas behind an nginx load balancer (round-robin). The api is
stateless: JWT in a cookie, carts in MongoDB, rate limits / socket.io / cache in Redis,
uploads on a shared volume.
a) Distribution: open http://localhost:8080/api/health several times — "instance"
   changes (also the X-Served-By header on every API response). Or, if Node.js is
   installed:   node scripts/scaling-demo.js 300 20
b) Fail-over: docker stop pcshop-api-2   -> the site keeps working (nginx retries on the
   other replicas). Start it again with: docker start pcshop-api-2
c) Scale out: docker compose up -d --scale api=5   -> the 2 new replicas receive traffic
   automatically, no nginx restart needed (verify with step a).
d) Real-time reviews across replicas: open the same product in two browsers; a comment
   posted in one appears in the other instantly even if the tabs are connected to
   different api replicas (socket.io Redis adapter).

7. BUSINESS RULES
-----------------
- Tax: VAT 10% on (subtotal - discount).
- Shipping: 30,000đ; free when the subtotal is at least 5,000,000đ.
- Discount: percentage of the subtotal (the only discount type in the system).
- Loyalty: every order earns floor(total x 10% / 1,000) points, where total is the amount
  actually paid (after discount and points). 1 point = 1,000đ. Points are credited when the
  order is placed and can be used right away on the next order, up to the full order total.
  Cancelling an order returns the points used and removes the points earned.
- Order statuses: pending -> confirmed -> shipping -> delivered (or cancelled before delivery).
  Cancelling returns the stock of every variant.
- Statistics: revenue = sum of order totals (cancelled orders excluded); profit =
  sum((unit price - unit cost) x qty) - discounts - points redeemed.

8. BONUS FEATURES IMPLEMENTED (details and evidence in the Bonus folder)
------------------------------------------------------------------------
1. CI/CD — GitHub Actions: lint, tests, frontend build and Docker image build per service
   on every push / pull request (.github/workflows/ci.yml).
2. Microservices — api, notification-service, search-service (+ seed job) communicate
   asynchronously through RabbitMQ (durable queues, acks, retry and dead-letter queues).
   RabbitMQ UI: http://localhost:15672  (user pcshop / password pcshop).
3. Elasticsearch — product search (fuzzy, accent-insensitive) with filters, sorting and
   brand facets executed in Elasticsearch; automatic fallback to MongoDB if ES is down.

9. NOTES
--------
- Google login and e-mail sending use the credentials in the .env file next to
  docker-compose.yml (Docker Compose loads it automatically). Without it the site still
  works: the Google button is hidden and e-mails are written to the notification logs
  (docker compose logs notification).
- Google OAuth redirect URI: http://localhost:8080/api/auth/google/callback
- Product images are original vector illustrations generated by the seeder (no third-party
  photos). The admin can upload JPG/PNG/WEBP images for new products.
