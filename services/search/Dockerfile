FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1
CMD ["node", "src/index.js"]
