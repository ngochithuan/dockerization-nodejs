# ---------- Worker: Notification service (RabbitMQ consumer) ----------
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

USER node

# The worker opens no HTTP port: it only receives messages from RabbitMQ and writes to MongoDB
CMD ["node", "worker.js"]
