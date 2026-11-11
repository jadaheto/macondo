import { defineConfig, devices } from '@playwright/test';

/**
 * E2E. Por defecto levanta `next start` en 3100 (requiere `npm run build` previo) o reutiliza un
 * servidor existente. Las pruebas interceptan /api/* en el navegador, así que NO necesitan la API.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-CO',
    trace: 'retain-on-failure',
    serviceWorkers: 'block', // las pruebas no dependen del SW
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['Galaxy Tab S4'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
