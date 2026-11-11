import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Suite E2E contra el stack REAL (ver playwright.config.ts de esta carpeta). Solo lectura sobre el
 * contenido publicado. Única excepción (prueba de acciones en lote): crea borradores con título
 * «Prueba QA …», los publica y los retira, y al final los deja RETIRED aunque la prueba falle.
 * La prueba de la pestaña Retos solo alterna un reto INACTIVO y lo restaura (el conteo de activos
 * no cambia). Los identificadores se descubren en la API: no dependen de una base de datos concreta.
 */

const TYPES = ['BOOK', 'AUDIOBOOK', 'AUDIOBIOGRAPHY', 'AUDIOSUMMARY', 'GALLERY'] as const;
type Type = (typeof TYPES)[number];
interface Res { id: string; title: string; type: Type; format: string; gradeMin: number; gradeMax: number; hasFile: boolean; hasCover: boolean; accessible: boolean }
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@macondo.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'MacondoDev2026!';

async function adminLogin(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Colección frente a metas de capacidad')).toBeVisible();
}
async function adminToken(request: APIRequestContext): Promise<string> {
  const r = await request.post('/api/auth/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(r.status()).toBe(200);
  return ((await r.json()) as { accessToken: string }).accessToken;
}
interface Page_ { items: Res[]; total: number; page: number; pageSize: number }

async function catalog(request: APIRequestContext, qs: string): Promise<Page_> {
  const r = await request.get(`/api/resources?${qs}`);
  expect(r.status()).toBe(200);
  return (await r.json()) as Page_;
}

/** Primer recurso accesible con el tipo/formato pedido (recorre páginas de 100). */
async function findResource(request: APIRequestContext, type: Type, format?: string): Promise<Res> {
  for (let page = 1; page <= 10; page++) {
    const p = await catalog(request, `type=${type}&pageSize=100&page=${page}`);
    const hit = p.items.find((r) => r.accessible && r.hasFile && (!format || r.format === format));
    if (hit) return hit;
    if (page * 100 >= p.total) break;
  }
  throw new Error(`No hay recurso ${type} ${format ?? ''} accesible en el stack`);
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}

test.describe('API', () => {
  test('health: API y base de datos OK', async ({ request }) => {
    const r = await request.get('/api/health');
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toMatchObject({ status: 'ok', db: 'ok' });
  });
});

test.describe('Catálogo', () => {
  test('el total del catálogo coincide con la suma por tipo y con la interfaz', async ({ page, request }) => {
    const counts: Record<string, number> = {};
    for (const t of TYPES) counts[t] = (await catalog(request, `type=${t}&pageSize=1`)).total;
    const total = (await catalog(request, 'pageSize=1')).total;
    test.info().annotations.push({ type: 'conteos', description: JSON.stringify({ ...counts, total }) });
    console.log('[e2e-real] conteos públicos', JSON.stringify({ ...counts, total }));
    expect(total).toBe(Object.values(counts).reduce((a, b) => a + b, 0));
    expect(total).toBeGreaterThan(0);

    const errors = trackErrors(page);
    const t0 = Date.now();
    await page.goto('/catalogo');
    const summary = page.getByText(/recursos · página 1 de/);
    await expect(summary).toBeVisible();
    console.log(`[e2e-real] /catalogo listo en ${Date.now() - t0} ms`);
    await expect(summary).toContainText(`${total} recursos`);
    await expect(summary).toContainText(`de ${Math.ceil(total / 24)}`);
    // Paginación
    await page.getByRole('button', { name: /Siguiente/ }).click();
    await expect(page.getByText(/recursos · página 2 de/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('filtros por tipo y por grado (UI = API)', async ({ page, request }) => {
    const bios = (await catalog(request, 'type=AUDIOBIOGRAPHY&pageSize=1')).total;
    const g3 = (await catalog(request, 'grade=3&pageSize=1')).total;
    const both = await catalog(request, 'type=AUDIOBOOK&grade=3&pageSize=100');
    expect(both.items.every((r) => r.type === 'AUDIOBOOK' && r.gradeMin <= 3 && r.gradeMax >= 3)).toBe(true);

    await page.goto('/catalogo');
    await expect(page.getByText(/recursos · página 1 de/)).toBeVisible();
    await page.selectOption('#tipo', 'AUDIOBIOGRAPHY');
    await expect(page.getByText(new RegExp(`^${bios} recursos? · página 1`))).toBeVisible();
    await expect(page).toHaveURL(/type=AUDIOBIOGRAPHY/);

    await page.selectOption('#tipo', '');
    await page.selectOption('#grado', '3');
    await expect(page.getByText(new RegExp(`^${g3} recursos? · página 1`))).toBeVisible();

    await page.selectOption('#tipo', 'AUDIOBOOK');
    await expect(page.getByText(new RegExp(`^${both.total} recursos? · página 1`))).toBeVisible();
  });
});

test.describe('Lectores', () => {
  test('EPUB: abre y muestra texto del libro', async ({ page, request }) => {
    const r = await findResource(request, 'BOOK', 'EPUB');
    const errors = trackErrors(page);
    const t0 = Date.now();
    await page.goto(`/leer/${r.id}`);
    const frame = page.frameLocator('iframe').first();
    await expect(frame.locator('body')).not.toBeEmpty({ timeout: 30_000 });
    await expect.poll(async () => (await frame.locator('body').innerText()).trim().length, { timeout: 30_000 }).toBeGreaterThan(5);
    console.log(`[e2e-real] EPUB «${r.title}» renderizado en ${Date.now() - t0} ms`);
    await page.getByRole('button', { name: 'Página siguiente' }).click();
    expect(errors).toEqual([]);
  });

  test('PDF: abre y dibuja la página 1 en el canvas', async ({ page, request }) => {
    const r = await findResource(request, 'BOOK', 'PDF');
    const errors = trackErrors(page);
    const t0 = Date.now();
    await page.goto(`/leer/${r.id}`);
    const canvas = page.locator('canvas[role=img]');
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expect(canvas).toHaveAttribute('aria-label', /página 1 de \d+/);
    const w = await canvas.evaluate((c) => (c as HTMLCanvasElement).width);
    expect(w).toBeGreaterThan(100);
    console.log(`[e2e-real] PDF «${r.title}» renderizado en ${Date.now() - t0} ms`);
    await page.getByRole('button', { name: 'Página siguiente' }).click();
    await expect(canvas).toHaveAttribute('aria-label', /página 2 de/);
    expect(errors).toEqual([]);
  });

  test('MP3: reproduce y salta con peticiones Range (206)', async ({ page, request }) => {
    const r = await findResource(request, 'AUDIOBOOK', 'MP3');
    // Range directo a la API (vía proxy)
    const part = await request.get(`/api/resources/${r.id}/file`, { headers: { Range: 'bytes=1000-1999' } });
    expect(part.status()).toBe(206);
    expect(part.headers()['content-range']).toMatch(/^bytes 1000-1999\/\d+$/);
    expect((await part.body()).length).toBe(1000);

    const ranges: string[] = [];
    page.on('response', (res) => { if (res.url().includes(`/api/resources/${r.id}/file`)) ranges.push(`${res.status()} ${res.headers()['content-range'] ?? ''}`); });
    await page.goto(`/leer/${r.id}`);
    await page.getByRole('button', { name: 'Reproducir' }).click();
    const audio = page.locator('audio');
    await expect.poll(() => audio.evaluate((a) => (a as HTMLAudioElement).currentTime), { timeout: 20_000 }).toBeGreaterThan(0.3);
    const duration = await audio.evaluate((a) => (a as HTMLAudioElement).duration);
    expect(duration).toBeGreaterThan(10);
    const target = Math.floor(duration * 0.6);
    await audio.evaluate((a, t) => { (a as HTMLAudioElement).currentTime = t; }, target);
    await expect.poll(() => audio.evaluate((a) => (a as HTMLAudioElement).currentTime), { timeout: 20_000 }).toBeGreaterThan(target);
    await page.getByRole('button', { name: 'Pausar' }).click();
    expect(ranges.some((x) => x.startsWith('206'))).toBe(true);
    console.log(`[e2e-real] MP3 «${r.title}» ${Math.round(duration)} s; respuestas: ${[...new Set(ranges)].slice(0, 4).join(' | ')}`);
  });
});

test.describe('Galería y retos', () => {
  test('galería: todas las imágenes cargan y el visor abre con zoom', async ({ page, request }) => {
    const r = await findResource(request, 'GALLERY');
    const g = await (await request.get(`/api/resources/${r.id}/gallery`)).json();
    const n = (g.items as unknown[]).length;
    expect(n).toBeGreaterThan(0);
    await page.goto(`/galeria/${r.id}`);
    const thumbs = page.getByRole('list', { name: 'Imágenes de la galería' }).locator('img');
    await expect(thumbs).toHaveCount(n);
    for (let i = 0; i < n; i++) {
      await thumbs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(() => thumbs.nth(i).evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
    }
    await page.getByRole('button', { name: /Ampliar imagen 1 de/ }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg).toBeVisible();
    await page.getByRole('button', { name: 'Acercar' }).click();
    await expect(dlg).toContainText('150%');
    await page.keyboard.press('Escape');
    await expect(dlg).toHaveCount(0);
    await expect(page.getByText('Créditos de las imágenes')).toBeVisible();
  });

  for (const [kind, label, finish, result] of [
    ['trivia', 'Trivia', 'Revisar respuestas', /Acertaste \d+ de \d+/],
    ['sequence', 'Ordena la secuencia', 'Comprobar orden', /Secuencia perfecta|sucesos están en su lugar/],
    ['match', 'Relaciona', 'Comprobar parejas', /parejas son correctas/],
  ] as const) {
    test(`reto «${kind}» se resuelve de principio a fin`, async ({ page, request }) => {
      const list = (await (await request.get('/api/challenges')).json()) as { kind: string }[];
      expect(list.some((c) => c.kind === kind)).toBe(true);
      await page.goto('/retos');
      await page.locator('main li button', { hasText: label }).first().click();
      if (kind === 'trivia') {
        for (const fs of await page.locator('fieldset').all()) await fs.locator('label').first().click();
      }
      if (kind === 'match') {
        // solo los botones de elemento (con aria-pressed); los de «Quitar» aparecen al emparejar
        const left = page.getByRole('list', { name: 'Columna izquierda' }).locator('li > button[aria-pressed]');
        const right = page.getByRole('list', { name: 'Columna derecha' }).locator('li > button');
        const n = await left.count();
        for (let i = 0; i < n; i++) { await left.nth(i).click(); await right.nth(i).click(); }
      }
      await page.getByRole('button', { name: finish }).click();
      await expect(page.getByRole('status').filter({ hasText: result })).toBeVisible();
    });
  }
});

test.describe('Kiosco y TV', () => {
  test('kiosco: inactividad → aviso → reinicio con estado limpio (?inactividad=5&aviso=3)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/kiosco?inactividad=5&aviso=3');
    await page.evaluate(() => localStorage.setItem('macondo.favorites', '["x"]'));
    await page.getByLabel('Buscar en la biblioteca').fill('cuento');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('heading', { name: /Resultados para/ })).toBeVisible();
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Explora por categoría' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('Buscar en la biblioteca')).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('macondo.favorites'))).toBeNull();
  });

  test('kiosco 32" vertical 1080×1920 con ?escala=1.5: zoom, 2 columnas, sin desbordamiento, detalle real con portada y QR grande', async ({ page }) => {
    await page.setViewportSize({ width: 1080, height: 1920 });
    await page.goto('/kiosco?escala=1.5');
    const root = page.getByTestId('kiosk-root');
    await expect(root).toHaveAttribute('data-escala', '1.5');
    await expect(root).toHaveAttribute('data-orientacion', 'vertical');
    expect(await root.evaluate((el) => getComputedStyle(el).zoom)).toBe('1.5');
    const grid = page.getByTestId('kiosk-grid').locator('li');
    await expect(grid.first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const xs = await grid.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(2); // 720 px efectivos → 2 columnas
    const cats = await page.getByTestId('kiosk-categories').locator('button').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of cats) expect(h).toBeGreaterThanOrEqual(72);
    await grid.first().locator('button').click();
    const dlg = page.getByTestId('kiosk-detail');
    await expect(dlg).toBeVisible();
    const qr = page.getByRole('img', { name: /Código QR/ });
    await expect(qr).toBeVisible();
    expect((await qr.boundingBox())!.width).toBeGreaterThanOrEqual(400);
    const cover = dlg.locator('img[alt^="Portada de"]').first();
    if ((await cover.count()) > 0) {
      await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await cover.getAttribute('src')).toMatch(/w=480/);
    }
    const d = (await dlg.boundingBox())!;
    expect(d.y).toBeGreaterThanOrEqual(0);
    expect(d.y + d.height).toBeLessThanOrEqual(1920);
    const config = await page.evaluate(() => JSON.parse(localStorage.getItem('macondo.kiosk.config') ?? '{}') as { scale?: number });
    expect(config.scale).toBe(1.5);
  });

  test('TV: 6 bloques en el rail, rotación completa de 120 s (reloj simulado) y QR', async ({ page, request }) => {
    const schedule = (await (await request.get('/api/tv/schedule')).json()) as { durationSeconds: number }[];
    expect(schedule.length).toBeGreaterThanOrEqual(6);
    await page.clock.install();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tv?origin=http://192.168.31.240:3100&animaciones=0');
    await expect(page.getByTestId('tv-root')).toHaveAttribute('data-source', 'live');
    await expect(page.getByTestId('tv-root')).toHaveAttribute('data-animaciones', '0');
    const rail = page.getByTestId('tv-rail').locator('li');
    await expect(rail).toHaveCount(6);
    const seen: string[] = [];
    const qr: Record<string, boolean> = {};
    for (let i = 0; i < schedule.length; i++) {
      const slide = page.getByTestId('tv-slide');
      const block = (await slide.getAttribute('data-block')) ?? '?';
      seen.push(block);
      await expect(page.getByTestId('tv-rail').locator('li[data-on-air="true"]')).toHaveCount(1);
      qr[block] = (await page.getByRole('img', { name: /Código QR/ }).count()) > 0;
      await page.clock.runFor((schedule[i]!.durationSeconds || 20) * 1000 + 50);
    }
    // vuelve al primero tras el ciclo
    await expect(page.getByTestId('tv-slide')).toHaveAttribute('data-block', seen[0]!);
    console.log(`[e2e-real] TV bloques: ${seen.join(' → ')} · QR: ${JSON.stringify(qr)}`);
    expect(new Set(seen).size).toBe(6);
    for (const b of ['BOOK_OF_WEEK', 'FEATURED_AUTHOR', 'CHALLENGE']) expect(qr[b], `QR en ${b}`).toBe(true);
  });
});

test.describe('Administración', () => {
  test('login, KPIs del resumen = conteos públicos y búsqueda en toda la colección', async ({ page, request }) => {
    const pub: Record<string, number> = {};
    for (const t of TYPES) pub[t] = (await catalog(request, `type=${t}&pageSize=1`)).total;

    await page.goto('/admin');
    await page.getByLabel('Correo electrónico').fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@macondo.local');
    await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD ?? 'MacondoDev2026!');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Colección frente a metas de capacidad')).toBeVisible();

    const kpis = page.locator('.madm-kpis .pqr-priority-stat');
    await expect(kpis.first()).toBeVisible();
    const texts = await kpis.allInnerTexts();
    console.log('[e2e-real] KPIs:', texts.map((t) => t.replace(/\s+/g, ' ')).join(' | '));
    const labels: Record<Type, string> = { BOOK: 'Libro digital', AUDIOBOOK: 'Audiolibro', AUDIOBIOGRAPHY: 'Audiobiografía', AUDIOSUMMARY: 'Audioresumen', GALLERY: 'Galería interactiva' };
    for (const t of TYPES) {
      const card = texts.find((x) => x.includes(labels[t]));
      expect(card, labels[t]).toBeTruthy();
      expect(card!).toContain(`${pub[t]} publicados`);
    }
    expect(texts.some((x) => /Retos lectores/.test(x))).toBe(true);

    // Recursos: debe cargar TODA la colección (más de 100), no solo la primera página de la API
    const t0 = Date.now();
    await page.getByRole('tab', { name: 'Recursos' }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    console.log(`[e2e-real] listado admin listo en ${Date.now() - t0} ms`);
    const allCount = Number(await page.locator('.pqr-shortcut', { hasText: 'Todos' }).locator('span').innerText());
    const publicTotal = Object.values(pub).reduce((a, b) => a + b, 0);
    expect(allCount).toBeGreaterThanOrEqual(publicTotal);

    // Buscar un recurso antiguo (último de la lista alfabética pública) para probar que no se limita a 100
    const lastPage = Math.ceil(publicTotal / 100);
    const tail = await catalog(request, `pageSize=100&page=${lastPage}`);
    const target = tail.items[tail.items.length - 1]!;
    await page.locator('#adm-q').fill(target.title);
    await expect(page.locator('table tbody tr', { hasText: target.title }).first()).toBeVisible();
    console.log(`[e2e-real] búsqueda admin «${target.title}» encontrada; Todos=${allCount}`);
  });

  test('pestaña Retos: lista = API admin, filtros, alternar un reto inactivo (restaurado) y validación local del JSON', async ({ page, request }) => {
    const token = await adminToken(request);
    const auth = { Authorization: `Bearer ${token}` };
    type Ch = { id: string; title: string; kind: string; active: boolean; bands: string[] };
    const all = (await (await request.get('/api/admin/challenges', { headers: auth })).json()) as Ch[];
    const activeBefore = all.filter((c) => c.active).length;
    const publicBefore = ((await (await request.get('/api/challenges')).json()) as unknown[]).length;
    expect(publicBefore).toBe(activeBefore);

    await adminLogin(page);
    await page.getByRole('button', { name: 'Gestionar retos' }).click();
    await expect(page.getByRole('tab', { name: 'Retos' })).toHaveAttribute('aria-selected', 'true');
    const pager = page.locator('.pqr-inbox-pagination');
    await expect(pager).toContainText(`${all.length} de ${all.length} retos · ${activeBefore} activos`);
    const matches = all.filter((c) => c.kind === 'match').length;
    await page.getByLabel('Tipo').selectOption('match');
    await expect(pager).toContainText(`${matches} de ${all.length} retos`);
    await page.getByLabel('Tipo').selectOption('');
    const band = all.filter((c) => c.bands.includes('1-3')).length;
    await page.getByLabel('Banda de grados').selectOption('1-3');
    await expect(pager).toContainText(`${band} de ${all.length} retos`);
    await page.getByLabel('Banda de grados').selectOption('');
    const inactiveCount = all.length - activeBefore;
    await page.getByLabel('Estado').selectOption('false');
    await expect(pager).toContainText(`${inactiveCount} de ${all.length} retos`);
    console.log(`[e2e-real] retos admin: ${all.length} en total, ${activeBefore} activos, ${matches} «match», ${band} en 1-3`);

    // Alternar SOLO un reto inactivo y restaurarlo: el conteo público de activos no cambia al final.
    const inactive = all.find((c) => !c.active);
    if (inactive) {
      await page.getByLabel('Estado').selectOption('');
      await page.locator('#ret-q').fill(inactive.id);
      // Tabla y tarjetas móviles coexisten en el DOM: solo el botón visible.
      const toggle = (verb: string) => page.locator(`button[aria-label="${verb} ${inactive.title.replace(/"/g, '\\"')}"]:visible`);
      try {
        await toggle('Activar').click();
        await expect(toggle('Desactivar')).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(async () => ((await (await request.get('/api/challenges')).json()) as unknown[]).length).toBe(activeBefore + 1);
        await toggle('Desactivar').click();
        await expect(toggle('Activar')).toHaveAttribute('aria-pressed', 'false');
      } finally {
        await request.post(`/api/admin/challenges/${inactive.id}/active`, { headers: auth, data: { active: false } });
      }
    } else {
      console.log('[e2e-real] no hay retos inactivos: se omite la prueba de alternar');
    }
    expect(((await (await request.get('/api/challenges')).json()) as unknown[]).length).toBe(activeBefore);

    // Importar JSON: la validación local detiene el envío (no se crea nada en la base de datos)
    await page.getByRole('button', { name: 'Importar JSON' }).click();
    await page.locator('#ret-json').fill('[{"id":"Prueba QA","kind":"trivia","title":"x","bands":[]}]');
    await page.getByRole('button', { name: 'Importar', exact: true }).click();
    await expect(page.locator('#ret-json-err')).toContainText('reto 1');
    expect(((await (await request.get('/api/admin/challenges', { headers: auth })).json()) as unknown[]).length).toBe(all.length);
  });

  test('acciones en lote: publicar y retirar borradores «Prueba QA» (creados aquí; quedan RETIRED al final)', async ({ page, request }) => {
    const token = await adminToken(request);
    const auth = { Authorization: `Bearer ${token}` };
    const stamp = Date.now().toString(36);
    const input = (title: string) => ({
      title, creator: 'Equipo QA Macondo', type: 'BOOK', description: 'Recurso temporal de la prueba E2E de acciones en lote.', gradeMin: 4, gradeMax: 6, categories: ['prueba-qa'],
      license: { rightsHolder: 'Prueba QA', licenseName: 'Prueba interna', licenseUrl: null, authorizedDevices: 1, offlineAllowed: false, validFrom: null, validUntil: null, territory: 'CO' },
    });
    const ids: string[] = [];
    const publicBefore = (await catalog(request, 'pageSize=1')).total;
    try {
      for (const t of [`Prueba QA lote A ${stamp}`, `Prueba QA lote B ${stamp}`]) {
        const r = await request.post('/api/admin/resources', { headers: auth, data: input(t) });
        expect(r.status()).toBe(201);
        ids.push(((await r.json()) as { id: string }).id);
      }
      await adminLogin(page);
      await page.getByRole('tab', { name: 'Recursos' }).click();
      await page.locator('#adm-q').fill(`Prueba QA lote`);
      const rows = page.locator('table tbody tr', { hasText: stamp });
      await expect(rows).toHaveCount(2);
      const cb = (letter: string) => page.locator(`input[aria-label="Seleccionar Prueba QA lote ${letter} ${stamp}"]:visible`);
      await cb('A').check();
      await cb('B').check();
      const bar = page.getByTestId('bulk-bar');
      await expect(bar).toContainText('2 seleccionados');

      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Publicar seleccionados' }).click();
      await expect(bar.getByRole('status')).toContainText('Publicar: 2 de 2 completados.');
      for (const id of ids) expect(((await (await request.get(`/api/admin/resources/${id}`, { headers: auth })).json()) as { status: string }).status).toBe('PUBLISHED');
      expect((await catalog(request, 'pageSize=1')).total).toBe(publicBefore + 2);

      // Tras publicar, la selección se vacía (todo salió bien): volver a seleccionar y retirar
      await expect(rows.locator('.pqr-badge', { hasText: 'Publicado' })).toHaveCount(2);
      await cb('A').check();
      await cb('B').check();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Retirar seleccionados' }).click();
      await expect(bar.getByRole('status')).toContainText('Retirar: 2 de 2 completados.');
      for (const id of ids) expect(((await (await request.get(`/api/admin/resources/${id}`, { headers: auth })).json()) as { status: string }).status).toBe('RETIRED');
      console.log(`[e2e-real] lote: ${ids.length} recursos Prueba QA publicados y retirados (${ids.join(', ')})`);
    } finally {
      for (const id of ids) await request.delete(`/api/admin/resources/${id}`, { headers: auth });
    }
    expect((await catalog(request, 'pageSize=1')).total).toBe(publicBefore);
  });
});

test.describe('Portadas (miniaturas WebP)', () => {
  test('?w=240 devuelve WebP mucho más pequeño que el original con ETag/304; ancho inválido → 400; el catálogo solo pide miniaturas', async ({ page, request }) => {
    const first = await catalog(request, 'pageSize=24');
    const withCover = first.items.filter((r) => r.hasCover);
    expect(withCover.length).toBeGreaterThan(0);
    const r = withCover[0]!;
    const orig = await request.get(`/api/resources/${r.id}/cover`);
    expect(orig.status()).toBe(200);
    const small = await request.get(`/api/resources/${r.id}/cover?w=240`);
    expect(small.status()).toBe(200);
    expect(small.headers()['content-type']).toContain('image/webp');
    const origLen = (await orig.body()).length;
    const smallLen = (await small.body()).length;
    expect(smallLen).toBeLessThan(origLen / 4);
    const etag = small.headers().etag!;
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
    expect((await request.get(`/api/resources/${r.id}/cover?w=240`, { headers: { 'If-None-Match': etag } })).status()).toBe(304);
    expect((await request.get(`/api/resources/${r.id}/cover?w=480`)).headers()['content-type']).toContain('image/webp');
    expect((await request.get(`/api/resources/${r.id}/cover?w=999`)).status()).toBe(400);
    expect((await request.get(`/api/resources/${r.id}/cover?w=abc`)).status()).toBe(400);

    let total = 0;
    let totalSmall = 0;
    for (const it of withCover) {
      total += (await (await request.get(`/api/resources/${it.id}/cover`)).body()).length;
      totalSmall += (await (await request.get(`/api/resources/${it.id}/cover?w=240`)).body()).length;
    }
    console.log(`[e2e-real] portadas página 1 del catálogo: ${withCover.length} · originales ${total} B · w=240 ${totalSmall} B (${Math.round(100 - (totalSmall / total) * 100)} % menos)`);
    expect(totalSmall).toBeLessThan(total / 4);

    const coverUrls: string[] = [];
    page.on('request', (req) => { if (req.url().includes('/cover')) coverUrls.push(new URL(req.url()).pathname + new URL(req.url()).search); });
    await page.goto('/catalogo');
    const img = page.locator('img[alt^="Portada de"]').first();
    await expect(img).toHaveAttribute('src', /\/cover\?w=240$/);
    await expect(img).toHaveAttribute('srcset', /\?w=480 480w/);
    await expect(img).toHaveAttribute('width', '240');
    await expect.poll(() => img.evaluate((i) => (i as HTMLImageElement).naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
    expect(coverUrls.length).toBeGreaterThan(0);
    expect(coverUrls.filter((u) => /\/cover$/.test(u))).toEqual([]); // ninguna portada a tamaño completo en la cuadrícula

    // Ficha: tamaño grande
    await page.goto(`/recurso/${r.id}`);
    await expect(page.locator('img[alt^="Portada de"]').first()).toHaveAttribute('src', /\/cover\?w=480$/);
  });
});

test.describe('Taller de cuentos (ADR-018): solo lectura, sin generar cuentos', () => {
  test('GET /api/cuentos/disponible responde bandas y modo; el panel lista la cola sin error', async ({ request }) => {
    const r = await request.get('/api/cuentos/disponible');
    expect(r.status()).toBe(200);
    const body = (await r.json()) as { habilitado: boolean; bandas: string[]; modo: string };
    expect(body.habilitado).toBe(true);
    expect(body.bandas).toEqual(expect.arrayContaining(['1-3', '4-5']));
    expect(['ia', 'plantilla']).toContain(body.modo);
    expect((await request.get('/api/cuentos/no-existe')).status()).toBe(404);
    expect((await request.get('/api/admin/cuentos')).status()).toBe(401);
    const token = await adminToken(request);
    const lista = await request.get('/api/admin/cuentos?status=PENDING_REVIEW', { headers: { Authorization: `Bearer ${token}` } });
    expect(lista.status()).toBe(200);
    expect(Array.isArray(await lista.json())).toBe(true);
  });

  test('la página /construye-tu-cuento carga para 1-3 con el asistente (sin enviar nada) y muestra «próximamente» a 9-11', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('macondo.gradeBand', JSON.stringify('1-3')));
    await page.goto('/construye-tu-cuento');
    await expect(page.getByRole('heading', { name: 'Taller de cuentos' })).toBeVisible();
    await page.getByRole('button', { name: 'Empezar mi cuento' }).click();
    await expect(page.getByRole('heading', { name: 'Los creadores' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Un ser de leyenda/ })).toBeVisible();
    await page.evaluate(() => localStorage.setItem('macondo.gradeBand', JSON.stringify('9-11')));
    await page.goto('/construye-tu-cuento');
    await expect(page.getByText('todavía no está disponible para tu grado')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
