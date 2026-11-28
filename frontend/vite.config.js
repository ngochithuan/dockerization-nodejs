import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API / websocket / uploads to the dockerised nginx load balancer.
const target = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/uploads': target,
      '/socket.io': { target, ws: true },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
