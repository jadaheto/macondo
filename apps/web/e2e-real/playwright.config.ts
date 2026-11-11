import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el STACK REAL (web + API + Postgres con el catálogo cargado). Solo lectura:
 * no crea, publica, retira ni borra contenido. Única escritura indirecta: la API suma contadores
 * agregados de apertura (ReadingEvent) al abrir archivos, igual que un estudiante.
 *
 *   E2E_BASE_URL=http://192.168.31.240:3100 npm run e2e:real -w @macondo/web
 *
 * No levanta servidor: el stack debe estar arriba (docker compose up -d).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.real\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // el login admin tiene límite de intentos global: una sola sesión por ejecución
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    locale: 'es-CO',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    // Sin dispositivo de audio (servidor/CI) el reloj de <audio> no avanza: salida de audio simulada.
    launchOptions: { args: ['--disable-audio-output'] },
  },
});
