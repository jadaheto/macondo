import { expect, test } from '@playwright/test';
import { apiDown, json } from './fixtures';

test('TV muestra la diapositiva institucional de respaldo si la API está caída', async ({ page }) => {
  await apiDown(page);
  await page.goto('/tv');
  const root = page.getByTestId('tv-root');
  await expect(root).toHaveAttribute('data-source', 'fallback');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Biblioteca Macondo');
  await expect(page.getByText('modo respaldo')).toBeVisible();
});

test('TV usa la programación en vivo y la guarda; luego sobrevive a la caída con la caché', async ({ page }) => {
  const slides = [
    { id: 's1', kind: 'BOOK_OF_WEEK', title: 'Libro de prueba', body: 'Texto', order: 0, durationSeconds: 3, active: true, resourceId: null },
    { id: 's2', kind: 'FUN_FACT', title: 'Dato de prueba', body: '', order: 1, durationSeconds: 3, active: true, resourceId: null },
  ];
  await page.route('**/api/tv/schedule', (route) => json(route, slides));
  await page.goto('/tv');
  await expect(page.getByTestId('tv-root')).toHaveAttribute('data-source', 'live');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Libro de prueba');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dato de prueba', { timeout: 6_000 });

  await page.unroute('**/api/tv/schedule');
  await apiDown(page);
  await page.reload();
  await expect(page.getByTestId('tv-root')).toHaveAttribute('data-source', 'cache');
  await expect(page.getByText('programación guardada')).toBeVisible();
});

test('TV: 6 bloques con rail «Programación», EN PANTALLA, avance, QR y tratamiento por bloque', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const res = { id: 'r1', title: 'Cuentos de la selva', creator: 'Horacio Quiroga', type: 'BOOK', hasCover: false, description: 'Relatos de animales de la selva.' };
  const mk = (i: number, kind: string, title: string, body: string, resource: unknown = null) =>
    ({ id: `t${i}`, kind, title, body, order: i, durationSeconds: 3, active: true, resourceId: resource ? 'r1' : null, resource });
  const slides = [
    mk(0, 'BOOK_OF_WEEK', 'Libro de la semana', '', res),
    mk(1, 'AGENDA', 'Esta semana', 'Hora del cuento – sábados 10:00 a. m.\nClub de lectura – miércoles 3:00 p. m.'),
    mk(2, 'FUN_FACT', 'Curiosidad', 'Un dato.'),
    mk(3, 'FEATURED_AUTHOR', 'Rafael Pombo', 'Poeta bogotano.', res),
    mk(4, 'CHALLENGE', 'Retos lectores', 'Frase de prueba\n— Autor, obra\nResuelve un reto hoy.'),
    mk(5, 'TUTORIAL', 'Cómo usar el kiosco', 'Elige tu grado\nBusca\nToca Leer'),
  ];
  await page.route('**/api/tv/schedule', (route) => json(route, slides));
  await page.goto('/tv?origin=http://192.168.1.50:3100');
  await expect(page.getByTestId('tv-root')).toHaveAttribute('data-source', 'live');
  await expect(page.getByText('Biblioteca TV', { exact: true })).toBeVisible();
  await expect(page.getByText(/Programación automática/)).toBeVisible();

  const rail = page.getByTestId('tv-rail').locator('li');
  await expect(rail).toHaveCount(6);
  await expect(rail.nth(0)).toHaveAttribute('data-on-air', 'true');
  await expect(page.getByTestId('tv-slide')).toHaveAttribute('data-block', 'BOOK_OF_WEEK');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cuentos de la selva');
  await expect(page.getByText('Relatos de animales de la selva.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible();
  await expect(page.getByText('Escanea y descubre más')).toBeVisible();

  const w1 = await page.getByTestId('tv-progress').evaluate((el) => parseFloat((el as HTMLElement).style.width));
  await page.waitForTimeout(1200);
  const w2 = await page.getByTestId('tv-progress').evaluate((el) => parseFloat((el as HTMLElement).style.width));
  expect(w2).toBeGreaterThan(w1);

  const order = ['AGENDA', 'FUN_FACT', 'FEATURED_AUTHOR', 'CHALLENGE', 'TUTORIAL'];
  for (const [i, block] of order.entries()) {
    await expect(page.getByTestId('tv-slide')).toHaveAttribute('data-block', block, { timeout: 5_000 });
    await expect(rail.nth(i + 1)).toHaveAttribute('data-on-air', 'true');
    if (block === 'AGENDA') await expect(page.getByText('sábados 10:00 a. m.')).toBeVisible();
    if (block === 'CHALLENGE') await expect(page.getByText('Escanea y juega')).toBeVisible();
    if (block === 'TUTORIAL') await expect(page.getByText('Elige tu grado')).toBeVisible();
  }
  await expect(page.getByTestId('tv-slide')).toHaveAttribute('data-block', 'BOOK_OF_WEEK', { timeout: 5_000 });
});

test('TV: ?animaciones=0 desactiva animaciones y transiciones; el cursor está oculto', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.route('**/api/tv/schedule', (route) => json(route, [
    { id: 'a1', kind: 'FUN_FACT', title: 'Dato', body: 'Texto.', order: 0, durationSeconds: 20, active: true, resourceId: null },
  ]));
  await page.goto('/tv?animaciones=0');
  const root = page.getByTestId('tv-root');
  await expect(root).toHaveAttribute('data-animaciones', '0');
  const css = await page.getByTestId('tv-slide').evaluate((el) => ({ anim: getComputedStyle(el).animationName, cursor: getComputedStyle(el).cursor }));
  expect(css.anim).toBe('none');
  expect(css.cursor).toBe('none');
  expect(await page.getByTestId('tv-progress').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
});
