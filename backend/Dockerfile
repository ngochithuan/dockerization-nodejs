# ---------- Backend: Node.js + Express REST API ----------
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Copy package*.json first to make use of the layer cache:
# `npm ci` only re-runs when dependencies change, not on every code edit
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Do not run as root
USER node

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

# Exec form so Node receives SIGTERM from `docker stop` directly
CMD ["node", "server.js"]
