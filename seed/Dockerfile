# Seeder image. Build context = repository root, so the seeder reuses the api's Mongoose
# models (single source of truth for the schema) without duplicating them.
FROM node:22-alpine
WORKDIR /app
COPY services/api/package.json services/api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY services/api/src ./services/api/src
COPY seed ./seed
CMD ["node", "seed/index.js"]
