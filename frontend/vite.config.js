import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://cloud-based-service-availability.onrender.com',
      '/socket.io': {
        target: 'https://cloud-based-service-availability.onrender.com',
        ws: true,
      },
    },
  },
})