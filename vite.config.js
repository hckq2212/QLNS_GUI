import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During development proxy API requests to the backend to avoid CORS
    proxy: {
      // proxy any auth requests
      '/api/auth': {
        target: 'http://192.168.130.239:3000',
        changeOrigin: true,
        secure: false,
      },
      // proxy opportunity and related API requests
      '/api/opportunity': {
        target: 'http://192.168.130.239:3000',
        changeOrigin: true,
        secure: false,
      },
      // generic fallback for other API paths (optional)
      '/api/contract': {
        target: 'http://192.168.130.239:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
