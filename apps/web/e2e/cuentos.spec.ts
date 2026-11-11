import { expect, test, type Page } from '@playwright/test';
import { json } from './fixtures';

/** Taller de cuentos con la API simulada: asistente de 3 pasos → generación (sondeo) → resultado → guardar. */

const contenido = {
  titulo: 'Lía y el cangrejo azul',
  sinopsis: 'Lía encuentra un cangrejo atrapado en Coveñas y, con Tomás, aprende que juntos llegan más lejos.',
  parrafos: ['En la playa de Coveñas sale el sol y Lía corre por la arena.', 'Un cangrejo azul está atrapado en una red.', 'Tomás y Lía halan juntos: ¡uno, dos, tres!', 'El cangrejo vuelve al mar y los dos sonríen.'],
  preguntas: [
    { pregunta: '¿Dónde pasa el cuento?', opciones: ['En Coveñas', 'En Sincelejo', 'En el espacio'], respuesta: 0, explicacion: 'Pasa en la playa de Coveñas.' },
    { pregunta: '¿Quién ayuda a Lía?', opciones: ['Nadie', 'Tomás', 'Un robot'], respuesta: 1, explicacion: 'Tomás hala con ella.' },
    { pregunta: '¿Qué aprendió Lía?', opciones: ['A nadar', 'A correr', 'Que juntos llegan más lejos'], respuesta: 2, explicacion: 'Esa es la enseñanza.' },
  ],
  glosario: [{ palabra: 'red', significado: 'malla para pescar.' }, { palabra: 'lancha', significado: 'barco pequeño.' }],
  valorRecordatorio: 'Juntos llegamos más lejos.',
};

function cuentoDTO(status: string, over: Record<string, unknown> = {}) {
  return {
    id: 'cuento-1', status, modo: 'ia', banda: '1-3', titulo: contenido.titulo, autorNombre: 'Sofía', protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad',
    contenido: status === 'GENERATING' ? null : contenido,
    audio: { listo: status === 'PENDING_REVIEW', url: status === 'PENDING_REVIEW' ? '/api/cuentos/cuento-1/audio' : null, durationSeconds: 42, pendiente: status !== 'PENDING_REVIEW' },
    error: null, createdAt: '2026-11-05T12:00:00.000Z', ...over,
  };
}

async function setBand(page: Page, band: string) {
  await page.goto('/');
  await page.evaluate((b) => localStorage.setItem('macondo.gradeBand', JSON.stringify(b)), band);
}

test('asistente completo: creadores → lugar → enseñanza → generando → resultado con audio y preguntas', async ({ page }) => {
  let polls = 0;
  let posted: Record<string, unknown> | null = null;
  await page.route('**/api/cuentos/disponible', (route) => json(route, { habilitado: true, bandas: ['1-3', '4-5'], modo: 'ia' }));
  await page.route('**/api/cuentos', (route) => {
    posted = route.request().postDataJSON() as Record<string, unknown>;
    return json(route, { id: 'cuento-1', status: 'GENERATING' }, 202);
  });
  await page.route('**/api/cuentos/cuento-1', (route) => {
    polls += 1;
    return json(route, cuentoDTO(polls < 2 ? 'GENERATING' : polls < 3 ? 'GENERATED' : 'PENDING_REVIEW'));
  });
  await setBand(page, '1-3');
  await page.goto('/construye-tu-cuento');
  await expect(page.getByRole('heading', { name: 'Taller de cuentos' })).toBeVisible();
  await expect(page.getByText('Aquí el autor eres tú.')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar mi cuento' }).click();

  // Paso 1
  await expect(page.getByRole('heading', { name: 'Los creadores' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Escribe el nombre de tu protagonista' })).toBeVisible();
  await page.getByLabel('¿Cómo te llamas?').fill('Sofía');
  await page.getByLabel('¿Cómo se llama tu protagonista?').fill('Lía');
  await page.getByRole('radio', { name: /Una niña o un niño/ }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Paso 2 (elegir avanza solo)
  await expect(page.getByText('¿Dónde pasa la historia?')).toBeVisible();
  await page.getByRole('radio', { name: /Playas de Coveñas/ }).click();

  // Paso 3
  await expect(page.getByText('¿Qué quieres que aprenda quien lo lea?')).toBeVisible();
  const escribir = page.getByRole('button', { name: '¡Escribir mi cuento!' });
  await expect(escribir).toBeDisabled();
  await page.getByRole('radio', { name: /Juntos llegamos más lejos/ }).click();
  await escribir.click();

  await expect(page.getByText('Tu cuento se está escribiendo…')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lía y el cangrejo azul' })).toBeVisible({ timeout: 15_000 });
  expect(posted).toMatchObject({ banda: '1-3', autorNombre: 'Sofía', protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad' });
  expect(typeof posted!.deviceId).toBe('string');
  await expect(page.getByText('Escrito por Sofía con ayuda del taller')).toBeVisible();
  await expect(page.getByTestId('cuento-portada')).toBeVisible();
  await expect(page.getByText('Tomás y Lía halan juntos: ¡uno, dos, tres!')).toBeVisible();
  await expect(page.getByTestId('cuento-audio')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/quedó en la biblioteca para que la bibliotecaria lo revise/)).toBeVisible();

  // Trivia reutilizada
  await page.getByRole('radio', { name: 'En Coveñas' }).click();
  await page.getByRole('radio', { name: 'Tomás' }).click();
  await page.getByRole('radio', { name: 'Que juntos llegan más lejos' }).click();
  await page.getByRole('button', { name: 'Revisar respuestas' }).click();
  await expect(page.getByText('Acertaste 3 de 3.')).toBeVisible();

  // Guardar en esta tablet
  await page.getByRole('button', { name: 'Guardar en esta tablet' }).click();
  await expect(page.getByRole('button', { name: 'Guardado en esta tablet' })).toBeDisabled();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('macondo.cuentos.mios') ?? '[]'));
  expect(saved).toHaveLength(1);
  expect(saved[0].titulo).toBe('Lía y el cangrejo azul');

  // Hacer otro cuento conserva el nombre del autor
  await page.getByRole('button', { name: 'Hacer otro cuento' }).click();
  await expect(page.getByLabel('¿Cómo te llamas?')).toHaveValue('Sofía');
  await expect(page.getByLabel('¿Cómo se llama tu protagonista?')).toHaveValue('');

  // /offline lista el cuento guardado
  await page.goto('/offline');
  await expect(page.getByRole('heading', { name: 'Mis cuentos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir Lía y el cangrejo azul' })).toBeVisible();
});

test('modo plantilla se anuncia con honestidad y el límite por hora muestra el mensaje del servidor', async ({ page }) => {
  await page.route('**/api/cuentos/disponible', (route) => json(route, { habilitado: true, bandas: ['1-3', '4-5'], modo: 'plantilla' }));
  await page.route('**/api/cuentos', (route) => json(route, { statusCode: 429, error: 'Too Many Requests', message: 'Ya hiciste 3 cuentos en esta hora. Puedes leerlos, escucharlos o volver más tarde para hacer otro.' }, 429));
  await setBand(page, '4-5');
  await page.goto('/construye-tu-cuento');
  await expect(page.getByText('Hoy el cuento lo armamos con nuestras plantillas.')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar mi cuento' }).click();
  await page.getByLabel('¿Cómo se llama tu protagonista?').fill('Robi');
  await page.getByRole('radio', { name: /Un robot curioso/ }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('radio', { name: /estación en el espacio/ }).click();
  await page.getByRole('radio', { name: /Preguntar es el primer paso/ }).click();
  await page.getByRole('button', { name: '¡Escribir mi cuento!' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Ya hiciste 3 cuentos en esta hora' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByText('¿Qué quieres que aprenda quien lo lea?')).toBeVisible();
});

test('bandas 6-8 y 9-11 ven «próximamente» y no tienen el módulo en el inicio; 1-3 sí lo tiene', async ({ page }) => {
  await page.route('**/api/cuentos/disponible', (route) => json(route, { habilitado: true, bandas: ['1-3', '4-5'], modo: 'ia' }));
  await setBand(page, '9-11');
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Taller de cuentos/ })).toHaveCount(0);
  await page.goto('/construye-tu-cuento');
  await expect(page.getByText('todavía no está disponible para tu grado')).toBeVisible();
  await setBand(page, '1-3');
  await page.goto('/');
  await page.getByRole('link', { name: /Inventar un cuento/ }).click();
  await expect(page).toHaveURL(/\/construye-tu-cuento/);
  await expect(page.getByRole('button', { name: 'Empezar mi cuento' })).toBeVisible();
});
