import { expect, test } from '@playwright/test';
import { demoResource, json } from './fixtures';

test('kiosco: aviso de inactividad y reinicio a la pantalla inicial con estado limpio', async ({ page }) => {
  await page.route('**/api/resources?**', (route) => json(route, { items: [demoResource()], total: 1, page: 1, pageSize: 10 }));
  await page.goto('/kiosco?inactividad=5&aviso=6');
  await page.evaluate(() => {
    localStorage.setItem('macondo.favorites', '["x"]');
    sessionStorage.setItem('macondo.algo', '1');
  });
  await page.getByLabel('Buscar en la biblioteca').fill('fábulas');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('heading', { name: /Resultados para/ })).toBeVisible();

  // Sin tocar nada: aparece el aviso y luego vuelve al inicio.
  await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 9_000 });
  await expect(page.getByText('¿Sigues ahí?')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explora por categoría' })).toBeVisible({ timeout: 9_000 });
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByLabel('Buscar en la biblioteca')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('macondo.favorites'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});

test('kiosco: tocar "Seguir explorando" cancela el reinicio', async ({ page }) => {
  await page.route('**/api/resources?**', (route) => json(route, { items: [], total: 0, page: 1, pageSize: 10 }));
  await page.goto('/kiosco?inactividad=5&aviso=6');
  await page.getByRole('button', { name: /Libro digital/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 9_000 });
  await page.getByRole('button', { name: 'Seguir explorando' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Libro digital' })).toBeVisible();
});

test('kiosco: detalle con QR solo para recursos accesibles', async ({ page }) => {
  await page.route('**/api/resources?**', (route) => json(route, { items: [demoResource()], total: 1, page: 1, pageSize: 10 }));
  await page.goto('/kiosco');
  await page.getByRole('button', { name: /Fábulas de Esopo/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('img', { name: /Código QR para abrir Fábulas/ })).toBeVisible();
});

test('kiosco 32" vertical (1080×1920) con ?escala=1.5: zoom en la raíz, 2 columnas, sin desbordamiento, detalle con QR y configuración oculta', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.route('**/api/resources?**', (route) => json(route, { items: [demoResource()], total: 1, page: 1, pageSize: 12 }));
  await page.goto('/kiosco?escala=1.5');
  const root = page.getByTestId('kiosk-root');
  await expect(root).toHaveAttribute('data-escala', '1.5');
  await expect(root).toHaveAttribute('data-orientacion', 'vertical');
  expect(await root.evaluate((el) => getComputedStyle(el).zoom)).toBe('1.5');
  // Persistencia de la escala que trae la URL
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('macondo.kiosk.config'))) ?? '{}')).toMatchObject({ scale: 1.5 });
  // Sin desbordamiento horizontal y categorías ≥72 px en 2 columnas (la quinta ocupa la fila)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const cats = page.getByTestId('kiosk-categories').locator('button');
  await expect(cats).toHaveCount(5);
  const boxes = await cats.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height, x: r.x })));
  for (const b of boxes) expect(b.h).toBeGreaterThanOrEqual(72);
  expect(boxes[0]!.x).not.toEqual(boxes[1]!.x);
  expect(boxes[4]!.w).toBeGreaterThan(boxes[0]!.w * 1.8);
  // Detalle: cabe en la ventana y el QR es grande
  await page.getByRole('button', { name: /Fábulas de Esopo/ }).click();
  const dlg = page.getByTestId('kiosk-detail');
  await expect(dlg).toBeVisible();
  const qr = page.getByRole('img', { name: /Código QR para abrir Fábulas/ });
  await expect(qr).toBeVisible();
  const qrBox = (await qr.boundingBox())!;
  expect(qrBox.width).toBeGreaterThanOrEqual(400); // 320 px × 1.5
  const dBox = (await dlg.boundingBox())!;
  expect(dBox.y).toBeGreaterThanOrEqual(0);
  expect(dBox.y + dBox.height).toBeLessThanOrEqual(1920);
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  // Configuración oculta: pulsación larga de 3 s sobre el logotipo; un toque corto solo vuelve al inicio
  const logo = page.getByTestId('kiosk-logo');
  await logo.click();
  await expect(page.getByTestId('kiosk-config')).toHaveCount(0);
  const lb = (await logo.boundingBox())!;
  await page.mouse.move(lb.x + 30, lb.y + lb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3200);
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Configuración del kiosco' })).toBeVisible();
  await expect(page.getByTestId('kiosk-cfg-orientation')).toHaveText('Vertical');
  await page.getByRole('radio', { name: '×1.25' }).click();
  await page.getByRole('radio', { name: '120 s' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('kiosk-config')).toHaveCount(0);
  await expect(root).toHaveAttribute('data-escala', '1.25');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('macondo.kiosk.config'))) ?? '{}')).toEqual({ timeoutSeconds: 120, warningSeconds: 10, scale: 1.25 });
});

test('kiosco horizontal (1920×1080): 5 categorías en fila y escala 1 por defecto', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.route('**/api/resources?**', (route) => json(route, { items: [], total: 0, page: 1, pageSize: 10 }));
  await page.goto('/kiosco');
  const root = page.getByTestId('kiosk-root');
  await expect(root).toHaveAttribute('data-escala', '1');
  await expect(root).toHaveAttribute('data-orientacion', 'horizontal');
  const ys = await page.getByTestId('kiosk-categories').locator('button').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
  expect(new Set(ys).size).toBe(1);
});
