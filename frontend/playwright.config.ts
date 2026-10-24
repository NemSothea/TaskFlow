import { defineConfig, devices } from '@playwright/test'

// E2E runs its own API (:8001), Vite (:5174) and database (taskflow_e2e) so it never
// collides with `scripts/dev.sh` or leaves test users in the dev database.
// Start it through `scripts/e2e.sh`, which creates that database and applies migrations first.
const API_PORT = 8001
const WEB_PORT = 5174
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://taskflow:taskflow_dev_password@127.0.0.1:5433/taskflow_e2e'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: `uv run python manage.py runserver 127.0.0.1:${API_PORT} --noreload`,
      cwd: '../backend',
      url: `http://127.0.0.1:${API_PORT}/admin/login/`,
      reuseExistingServer: false,
      env: {
        // Each test registers and logs in fresh users; the dev limit (10/min) would
        // make the suite flaky. Raised for this test server process only.
        AUTH_THROTTLE_RATE: '1000/min',
        REFRESH_THROTTLE_RATE: '1000/min',
        SECURE_COOKIES: 'False',
        DATABASE_URL: E2E_DATABASE_URL,
        CSRF_TRUSTED_ORIGINS: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      command: `npm run dev -- --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      env: { VITE_DEV_API_TARGET: `http://127.0.0.1:${API_PORT}` },
    },
  ],
})
