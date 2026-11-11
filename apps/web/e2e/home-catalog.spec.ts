import { expect, test } from '@playwright/test';
import { apiDown, demoResource, json } from './fixtures';

test('inicio → elegir grado → módulo → catálogo con resultados', async ({ page }) => {
  await page.route('**/api/resources?**', (route) => json(route, { items: [demoResource()], total: 1, page: 1, pageSize: 24 }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '¿En qué grado estás?' })).toBeVisible();
  await page.getByRole('button', { name: /4\.º y 5\.º/ }).first().click();
  await expect(page.getByRole('heading', { name: '¡Bienvenido, explorador!' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('macondo.gradeBand'))).toBe('"4-5"');
  await page.getByRole('link', { name: /Biblioteca digital/ }).click();
  await expect(page).toHaveURL(/\/catalogo\?type=BOOK&grade=4/);
  await expect(page.getByRole('heading', { level: 1, name: 'Libro digital' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fábulas de Esopo/ })).toBeVisible();
  await expect(page.getByText('1 recurso · página 1 de 1')).toBeVisible();
});

test('catálogo muestra error claro y botón Reintentar si la API no responde', async ({ page }) => {
  await apiDown(page);
  await page.goto('/catalogo');
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar el catálogo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('ficha y lector PDF (pdf.js + worker) con API simulada', async ({ page }) => {
  const { tinyPdf } = await import('./fixtures');
  await page.route('**/api/resources/demo-pdf', (route) => json(route, demoResource()));
  await page.route('**/api/resources/demo-pdf/file', (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: tinyPdf() }));
  await page.goto('/recurso/demo-pdf');
  await expect(page.getByRole('heading', { name: 'Fábulas de Esopo (demo)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar para uso sin conexión' })).toBeVisible();
  await page.getByRole('link', { name: 'Leer' }).click();
  await expect(page.getByText('de 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /página 1 de 2/ })).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByRole('img', { name: /página 2 de 2/ })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('macondo.reading.demo-pdf') ?? '{}').page);
  expect(saved).toBe(2);
});

test('recurso con licencia vencida explica por qué no está disponible', async ({ page }) => {
  await page.route('**/api/resources/vencido', (route) =>
    json(route, demoResource({ id: 'vencido', accessible: false, license: { ...demoResource().license, validUntil: '2020-01-01T00:00:00.000Z' } })),
  );
  await page.goto('/recurso/vencido');
  await expect(page.getByText('Este recurso no está disponible por ahora')).toBeVisible();
  await expect(page.getByText(/La licencia venció/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leer' })).toHaveCount(0);
});

test('URL desconocida: 404 en español con la identidad del portal (no la página por defecto de Next)', async ({ page }) => {
  const res = await page.goto('/esta-ruta-no-existe/de-verdad');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'No encontramos esta página' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Volver al inicio/ })).toBeVisible();
  await expect(page).toHaveTitle(/Página no encontrada/);
  await expect(page.getByText('This page could not be found')).toHaveCount(0);
});

test('catálogo: cambios rápidos de filtros no se pisan (tipo y luego grado sin esperar)', async ({ page }) => {
  // respuesta lenta para que la segunda selección ocurra con la transición del router pendiente
  await page.route('**/api/resources?**', async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    await json(route, { items: [demoResource()], total: 1, page: 1, pageSize: 24 });
  });
  await page.goto('/catalogo');
  await page.selectOption('#tipo', 'AUDIOBOOK');
  await page.selectOption('#grado', '3');
  await expect(page).toHaveURL(/type=AUDIOBOOK/);
  await expect(page).toHaveURL(/grade=3/);
  await page.selectOption('#tipo', '');
  await page.selectOption('#grado', '5');
  await expect(page).toHaveURL(/grade=5/);
  await expect(page).not.toHaveURL(/type=/);
});
