# ---------- Stage 1: build React app bằng Node ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Biến VITE_* được nhúng vào bundle lúc build (không đọc lúc chạy).
# Mặc định "/api": trình duyệt gọi cùng origin, Nginx chuyển tiếp sang backend.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Stage 2: phục vụ file tĩnh bằng Nginx ----------
# Image cuối chỉ chứa Nginx + thư mục dist, không có Node/node_modules
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
