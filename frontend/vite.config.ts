import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

// The API is proxied in development so the SPA and API share one origin.
// That keeps the refresh cookie first-party and lets CSRF work without CORS.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs in e2e/ run in a real browser via `npm run e2e`, not in Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    css: false,
  },
})
