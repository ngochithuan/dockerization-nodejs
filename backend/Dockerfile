# ---------- Backend: Node.js + Express REST API ----------
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Copy package*.json trước để tận dụng layer cache:
# chỉ chạy lại `npm ci` khi dependencies thay đổi, không phải mỗi lần sửa code
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Không chạy bằng root
USER node

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

# Exec form để Node nhận trực tiếp tín hiệu SIGTERM từ `docker stop`
CMD ["node", "server.js"]
