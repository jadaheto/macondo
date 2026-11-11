import { expect, test } from '@playwright/test';
import { apiDown, demoResource, json } from './fixtures';

test('admin: login valida en cliente y muestra error de conexión sin romperse', async ({ page }) => {
  await apiDown(page);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Ingreso para bibliotecarios' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Comfasucre' })).toBeVisible();
  await page.getByLabel('Correo electrónico').fill('no-es-correo');
  await page.getByLabel('Contraseña').fill('123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'correo válido' })).toBeVisible();
  await expect(page.locator('#email')).toHaveClass(/is-invalid/);
  await expect(page.locator('#email')).toBeFocused();
  await page.getByLabel('Correo electrónico').fill('bibliotecaria@macondo.local');
  await page.getByLabel('Contraseña').fill('contrasena-demo');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos conectar' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('admin')))).toEqual([]);
});

test('admin: bandeja de recursos PQR, filtros y formulario con errores junto al campo', async ({ page }) => {
  const resources = [
    demoResource(),
    demoResource({ id: 'r2', title: 'Borrador de prueba', status: 'DRAFT', hasFile: false, format: 'NONE', type: 'AUDIOBOOK', gradeMin: 6, gradeMax: 8 }),
    demoResource({ id: 'r3', title: 'Recurso retirado', status: 'RETIRED' }),
  ];
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/login') {
      return json(route, { accessToken: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Bibliotecaria demo', role: 'LIBRARIAN' } });
    }
    if (url.pathname === '/api/admin/resources') return json(route, { items: resources, total: resources.length });
    if (url.pathname === '/api/admin/stats') return json(route, {});
    return json(route, {});
  });
  await page.goto('/admin');
  await page.getByLabel('Correo electrónico').fill('bibliotecaria@macondo.local');
  await page.getByLabel('Contraseña').fill('contrasena-demo');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Macondo Digital', { exact: true })).toBeVisible();
  // Bibliotecario: sin pestaña de auditoría.
  await expect(page.getByRole('tab', { name: 'Auditoría' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Recursos' }).click();
  const results = page.locator('#pqrResults');
  await expect(results.locator('.pqr-badge.success:visible', { hasText: 'Publicado' }).first()).toBeVisible();
  await expect(results.locator('.pqr-badge.secondary:visible', { hasText: 'Borrador' }).first()).toBeVisible();
  await expect(results.locator('.pqr-badge.danger:visible', { hasText: 'Retirado' }).first()).toBeVisible();

  await page.locator('.pqr-shortcut', { hasText: 'Borradores' }).click();
  await expect(page.locator('.pqr-inbox-pagination')).toContainText('1–1 de 1 recursos');
  await page.getByRole('button', { name: /Filtros/ }).click();
  await page.getByLabel('Grado', { exact: true }).selectOption('2');
  await expect(page.getByText('No hay recursos con estos filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtros' }).first().click();
  await expect(page.locator('.pqr-inbox-pagination')).toContainText('de 3 recursos');

  await page.getByRole('button', { name: 'Nuevo recurso' }).click();
  await expect(page.locator('#pqrCreate')).toBeVisible();
  await page.locator('#f-creator').fill('Autora conservada');
  await page.getByRole('button', { name: 'Crear recurso (borrador)' }).click();
  await expect(page.locator('#f-title')).toBeFocused();
  await expect(page.locator('#err-title')).toContainText('título es obligatorio');
  await expect(page.locator('#f-creator')).toHaveValue('Autora conservada');
  await expect(page.getByText('Guarda primero el recurso como borrador')).toBeVisible();
});

test('admin: pestaña Retos (filtros, activar/desactivar, importar JSON) y acciones en lote con confirmación', async ({ page }) => {
  const resources = [
    demoResource({ id: 'd1', title: 'Borrador uno', status: 'DRAFT' }),
    demoResource({ id: 'd2', title: 'Borrador dos', status: 'DRAFT' }),
    demoResource({ id: 'p1', title: 'Publicado uno', status: 'PUBLISHED' }),
  ];
  const challenges = [
    { id: 'trivia-pombo', kind: 'trivia', title: 'Trivia de Pombo', source: '', bands: ['1-3'], text: '', active: true, resource: { id: 'p1', title: 'Fábulas', creator: 'Rafael Pombo', type: 'BOOK' }, questions: [{ prompt: '¿?', options: ['a', 'b'], answer: 0 }] },
    { id: 'orden-cuento', kind: 'sequence', title: 'Ordena el cuento', source: '', bands: ['6-8'], text: '', active: false, resource: null, steps: ['a', 'b'] },
  ];
  const calls: string[] = [];
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    const m = route.request().method();
    if (url.pathname === '/api/auth/login') return json(route, { accessToken: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Admin demo', role: 'ADMIN' } });
    if (url.pathname === '/api/admin/resources' && m === 'GET') return json(route, { items: resources, total: resources.length });
    if (url.pathname === '/api/admin/challenges' && m === 'GET') return json(route, challenges);
    if (url.pathname === '/api/admin/challenges/import' && m === 'POST') {
      const body = route.request().postDataJSON() as unknown[];
      calls.push(`import:${body.length}`);
      return json(route, { created: 1, updated: 0, unresolved: ['nuevo-reto'], total: body.length });
    }
    if (/^\/api\/admin\/challenges\/[^/]+\/active$/.test(url.pathname)) {
      calls.push(`toggle:${url.pathname.split('/')[4]}`);
      const c = challenges.find((x) => url.pathname.includes(x.id))!;
      return json(route, { ...c, active: (route.request().postDataJSON() as { active: boolean }).active });
    }
    if (/^\/api\/admin\/resources\/[^/]+\/status$/.test(url.pathname) && m === 'POST') {
      const id = url.pathname.split('/')[4]!;
      calls.push(`status:${id}`);
      if (id === 'd2') return json(route, { message: 'Falta el archivo' }, 409);
      const r = resources.find((x) => x.id === id)!;
      r.status = 'PUBLISHED';
      return json(route, r);
    }
    return json(route, {});
  });
  await page.goto('/admin');
  await page.getByLabel('Correo electrónico').fill('admin@macondo.local');
  await page.getByLabel('Contraseña').fill('contrasena-demo');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // KPI de retos enlaza con la pestaña
  await page.getByRole('button', { name: 'Gestionar retos' }).click();
  await expect(page.getByRole('tab', { name: 'Retos' })).toHaveAttribute('aria-selected', 'true');
  const results = page.locator('#pqrResults');
  await expect(results.locator('tbody tr')).toHaveCount(2);
  // Tabla (escritorio) y tarjetas (móvil) coexisten en el DOM: se consulta solo lo visible.
  const vis = (css: string) => page.locator(`${css}:visible`);
  await expect(results.locator('.madm-meta:visible', { hasText: 'Fábulas' }).first()).toBeVisible();
  await page.getByLabel('Tipo').selectOption('sequence');
  await expect(results.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Estado').selectOption('true');
  await expect(page.getByText('Ningún reto coincide con los filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtros' }).first().click();

  // Activar un reto inactivo
  await vis('button[aria-label="Activar Ordena el cuento"]').click();
  await expect(vis('button[aria-label="Desactivar Ordena el cuento"]')).toHaveAttribute('aria-pressed', 'true');
  expect(calls).toContain('toggle:orden-cuento');

  // Importar JSON: error de formato local (sin llamar a la API) y luego importación válida
  await page.getByRole('button', { name: 'Importar JSON' }).click();
  await page.locator('#ret-json').fill('{"a":1}');
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await expect(page.locator('#ret-json-err')).toContainText('arreglo');
  expect(calls.filter((c) => c.startsWith('import'))).toEqual([]);
  await page.locator('#ret-json').fill(JSON.stringify([{ id: 'nuevo-reto', kind: 'match', title: 'Nuevo', bands: ['4-5'], resource: { title: 'X', creator: 'Y' }, pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }] }]));
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await expect(page.getByText(/Importación terminada: 1 reto procesados, 1 nuevos, 0 actualizados/)).toBeVisible();
  await expect(page.getByText('1 sin obra enlazada', { exact: false })).toBeVisible();
  expect(calls).toContain('import:1');

  // Acciones en lote: seleccionar 2 borradores, confirmar y publicar uno a uno (uno falla)
  await page.getByRole('tab', { name: 'Recursos' }).click();
  await vis('input[aria-label="Seleccionar Borrador uno"]').check();
  await vis('input[aria-label="Seleccionar Borrador dos"]').check();
  await expect(page.getByTestId('bulk-bar')).toContainText('2 seleccionados');
  const dialogs: string[] = [];
  page.once('dialog', (d) => { dialogs.push(d.message()); d.accept(); });
  await page.getByRole('button', { name: 'Publicar seleccionados' }).click();
  await expect(page.getByTestId('bulk-bar').getByRole('status')).toContainText('Publicar: 1 de 2 completados, 1 con error');
  expect(dialogs[0]).toMatch(/¿Publicar 2 recurso\(s\)\?/);
  expect(calls.filter((c) => c.startsWith('status:'))).toEqual(['status:d1', 'status:d2']);
  await expect(page.getByTestId('bulk-bar').getByRole('list', { name: 'Recursos con error' })).toContainText('Borrador dos');
  // El que falló sigue seleccionado para reintentar; el publicado no
  await expect(vis('input[aria-label="Seleccionar Borrador dos"]')).toBeChecked();
  await expect(vis('input[aria-label="Seleccionar Borrador uno"]')).not.toBeChecked();
  // Cancelar la confirmación no llama a la API
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Retirar seleccionados' }).click();
  expect(calls.filter((c) => c.startsWith('retire'))).toEqual([]);
});
