# ---- deps: install production dependencies from the lockfile ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "src/server.js"]
