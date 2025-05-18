import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [
      "7360-177-63-207-217.ngrok-free.app", // or use a pattern like '.ngrok-free.app' for all similar domains
      "3da8-177-63-207-217.ngrok-free.app",
      "ea6b-186-223-81-216.ngrok-free.app",
      "f4ba-177-63-207-217.ngrok-free.app",
//	    ".ngrok-free.app",
    ],
  },
})
