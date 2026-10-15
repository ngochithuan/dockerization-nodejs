import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend Express (xem backend/server.js) chạy mặc định ở cổng 8080.
// Frontend gọi /api cùng origin, Vite chuyển tiếp sang backend nên không phụ thuộc CORS.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

const proxy = {
  '/api': { target: apiTarget, changeOrigin: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
