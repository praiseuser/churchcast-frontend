import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.loca.lt', '.ngrok-free.dev', '.ngrok-free.app'],
    proxy: {
      '/token': 'http://localhost:4001',
      '/api': 'http://localhost:4000',
    },
  },
})