/**
 * Taller de cuentos de extremo a extremo con proveedor de IA FALSO (inyectado en lugar de LLM_PROVIDER) y TTS
 * simulado (piper/lame en scripts): disponibilidad, creación y consulta, validaciones, límite por dispositivo (429),
 * guardias del panel, revisión (aprobar crea libro EPUB + audiolibro en el catálogo; rechazar no) y auditoría.
 */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CUENTO_LICENSE } from '@macondo/shared';
import { PrismaClient } from '@prisma/client';
import { mkdtempSync, rmSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { CuentosService } from '../src/cuentos/cuentos.service';
import { IMAGE_PROVIDER, type ImageProvider, type ImageRequest, ImageUnavailableError } from '../src/cuentos/image.provider';
import { LLM_PROVIDER, type LlmProvider, type LlmRequest, LlmUnavailableError } from '../src/cuentos/llm.provider';
import { generarPlantilla } from '../src/cuentos/plantilla';
import { ADMIN, binaryParser, LIBRARIAN, resetDb, tokenFor } from './helpers';
import { installFakeTts } from './tts-fixtures';

let app: INestApplication;
let prisma: PrismaClient;
let svc: CuentosService;
let adminToken: string;
let libToken: string;
let dir: string;
const savedEnv: Record<string, string | undefined> = {};
const http = () => request(app.getHttpServer());

/** Proveedor falso controlable desde las pruebas. */
const fake: LlmProvider & { calls: LlmRequest[]; next: Array<string | Error>; on: boolean } = {
  name: 'falso', calls: [], next: [], on: true,
  available: () => fake.on,
  async generate(req) {
    fake.calls.push(req);
    const r = fake.next.shift();
    if (r === undefined) throw new LlmUnavailableError('sin respuesta programada');
    if (r instanceof Error) throw r;
    return { text: r, ms: 25, usage: { prompt: 300, completion: 500 }, model: 'falso' };
  },
};

/** Proveedor de imágenes FALSO (ADR-020): devuelve un JPEG generado con sharp; `fail` simula al proveedor caído. */
const fakeImg: ImageProvider & { calls: ImageRequest[]; fail: boolean; on: boolean } = {
  name: 'falso-img', calls: [], fail: false, on: true,
  available: () => fakeImg.on,
  async generate(req) {
    fakeImg.calls.push(req);
    if (fakeImg.fail) throw new ImageUnavailableError('HTTP 429');
    const sharp = (await import('sharp')).default;
    const data = await sharp({ create: { width: req.width, height: req.height, channels: 3, background: '#7fb3d5' } }).jpeg().toBuffer();
    return { data, ms: 40, provider: 'falso-img' };
  },
};

const opciones = (over: Record<string, unknown> = {}) => ({ banda: '1-3', autorNombre: 'Sofía', protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad', deviceId: 'tablet-prueba-0001', ...over });
const iaJson = (over: Record<string, unknown> = {}) => JSON.stringify({ ...generarPlantilla({ banda: '1-3', protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad' }), titulo: 'Lía y el mar de Coveñas', ...over });

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'macondo-cuentos-e2e-'));
  const tts = installFakeTts(dir);
  for (const k of [...Object.keys(tts), 'CUENTOS_LIMITE_POR_HORA', 'CUENTOS_BANDAS', 'DEEPSEEK_API_KEY', 'IMAGENES_INTERVALO_MS']) savedEnv[k] = process.env[k];
  Object.assign(process.env, tts, { CUENTOS_LIMITE_POR_HORA: '3', CUENTOS_BANDAS: '1-3,4-5', DEEPSEEK_API_KEY: '', IMAGENES_INTERVALO_MS: '1' });
  prisma = new PrismaClient();
  await resetDb(prisma);
  const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(LLM_PROVIDER).useValue(fake).overrideProvider(IMAGE_PROVIDER).useValue(fakeImg).compile();
  app = mod.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  svc = app.get(CuentosService);
  adminToken = await tokenFor(app, ADMIN);
  libToken = await tokenFor(app, LIBRARIAN);
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  rmSync(dir, { recursive: true, force: true });
});

async function crearYEsperar(body: Record<string, unknown>) {
  const res = await http().post('/api/cuentos').send(body);
  expect(res.status, JSON.stringify(res.body)).toBe(202);
  expect(res.body).toMatchObject({ status: 'GENERATING' });
  await svc.esperar(res.body.id as string);
  const got = await http().get(`/api/cuentos/${res.body.id}`).expect(200);
  return got.body as { id: string; status: string; modo: string; titulo: string; contenido: { parrafos: string[] } | null; audio: { listo: boolean; url: string | null; durationSeconds: number | null }; imagen: { listo: boolean; url: string | null; pendiente: boolean }; autorNombre: string | null };
}

describe('público', () => {
  it('GET /api/cuentos/disponible informa bandas y modo según el proveedor', async () => {
    fake.on = true;
    expect((await http().get('/api/cuentos/disponible').expect(200)).body).toEqual({ habilitado: true, bandas: ['1-3', '4-5'], modo: 'ia' });
    fake.on = false;
    expect((await http().get('/api/cuentos/disponible').expect(200)).body.modo).toBe('plantilla');
    fake.on = true;
  });

  it('crea un cuento con IA (sin enviar el nombre del autor), lo narra y queda pendiente de revisión', async () => {
    fake.calls.length = 0;
    fake.next.push(iaJson());
    const c = await crearYEsperar(opciones());
    expect(c.status).toBe('PENDING_REVIEW');
    expect(c.modo).toBe('ia');
    expect(c.titulo).toBe('Lía y el mar de Coveñas');
    expect(c.autorNombre).toBe('Sofía');
    expect(c.contenido?.parrafos.length).toBeGreaterThan(3);
    expect(c.audio.listo).toBe(true);
    expect(c.audio.url).toBe(`/api/cuentos/${c.id}/audio`);
    expect(c.audio.durationSeconds).toBeGreaterThan(0);
    // Privacidad: el prompt lleva el protagonista pero nunca el autor.
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]!.user).toContain('Lía');
    expect(fake.calls[0]!.user).not.toContain('Sofía');
    expect(fake.calls[0]!.system).not.toContain('Sofía');
    // El audio se sirve con Range; el hash del dispositivo nunca se expone.
    const audio = await http().get(`/api/cuentos/${c.id}/audio`).set('Range', 'bytes=0-9').buffer().parse(binaryParser).expect(206);
    expect(audio.headers['content-type']).toBe('audio/mpeg');
    expect(JSON.stringify(c)).not.toContain('deviceHash');
    const row = await prisma.generatedStory.findUnique({ where: { id: c.id } });
    expect(row?.deviceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(row?.deviceHash).not.toBe('tablet-prueba-0001');
    expect(row?.providerMs).toBe(25);
    expect(row?.tokensIn).toBe(300);
    // Ilustración (ADR-020): lista, servida como JPEG 600×900, y el prompt SOLO lleva opciones cerradas (ni nombres ni texto).
    expect(c.imagen).toEqual({ listo: true, url: `/api/cuentos/${c.id}/imagen`, pendiente: false });
    const img = await http().get(`/api/cuentos/${c.id}/imagen`).buffer().parse(binaryParser).expect(200);
    expect(img.headers['content-type']).toBe('image/jpeg');
    const meta = await (await import('sharp')).default(img.body as Buffer).metadata();
    expect([meta.width, meta.height]).toEqual([600, 900]);
    const last = fakeImg.calls.at(-1)!;
    expect(last.prompt).toMatch(/Coveñas/);
    expect(last.prompt).toMatch(/friendship/);
    expect(last.prompt).not.toContain('Lía');
    expect(last.prompt).not.toContain('Sofía');
    expect(last.prompt).not.toContain(c.titulo);
    expect(row?.imageProvider).toBe('falso-img');
  });

  it('proveedor de imágenes caído → el cuento se completa sin ilustración (sin quedar pendiente)', async () => {
    fakeImg.fail = true;
    fake.next.push(iaJson({ titulo: 'Sin dibujo' }));
    try {
      const c = await crearYEsperar(opciones({ deviceId: 'tablet-prueba-0002' }));
      expect(c.status).toBe('PENDING_REVIEW');
      expect(c.imagen).toEqual({ listo: false, url: null, pendiente: false });
      await http().get(`/api/cuentos/${c.id}/imagen`).expect(404);
      const det = await http().get(`/api/admin/cuentos/${c.id}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(det.body.imagenAdmin).toMatchObject({ existe: false, oculta: false, error: 'HTTP 429' });
    } finally {
      fakeImg.fail = false;
    }
  });

  it('IA inválida → reintento estricto → plantilla (segundo intento también inválido)', async () => {
    fake.calls.length = 0;
    fake.next.push('{"titulo":"solo título"}', iaJson({ parrafos: ['La pistola brillaba.', 'Lía corrió.', 'Fin del cuento corto.'] }));
    const c = await crearYEsperar(opciones({ deviceId: 'tablet-prueba-0002', protagonista: 'Lía' }));
    expect(c.modo).toBe('plantilla');
    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[1]!.user).toMatch(/se rechazó por/);
    expect(c.status).toBe('PENDING_REVIEW');
  });

  it('proveedor caído → plantilla, y el cuento sigue funcionando', async () => {
    fake.next.push(new LlmUnavailableError('ENOTFOUND api.deepseek.com'));
    const c = await crearYEsperar(opciones({ deviceId: 'tablet-prueba-0003', autorNombre: null }));
    expect(c.modo).toBe('plantilla');
    expect(c.autorNombre).toBeNull();
    expect(c.contenido?.parrafos.join(' ')).toContain('Lía');
  });

  it('validaciones: nombre con groserías 400, caracteres raros 400, banda no habilitada 400, clave desconocida 400', async () => {
    const r1 = await http().post('/api/cuentos').send(opciones({ protagonista: 'Malparido' })).expect(400);
    expect(r1.body.message).toMatch(/no se puede usar/);
    await http().post('/api/cuentos').send(opciones({ protagonista: 'L1a<>' })).expect(400);
    await http().post('/api/cuentos').send(opciones({ autorNombre: 'Puta' })).expect(400);
    const r2 = await http().post('/api/cuentos').send(opciones({ banda: '6-8' })).expect(400);
    expect(r2.body.message).toMatch(/Próximamente/);
    await http().post('/api/cuentos').send(opciones({ ip: '1.2.3.4' })).expect(400);
    await http().post('/api/cuentos').send(opciones({ tipo: 'dragon' })).expect(400);
  });

  it('límite por dispositivo: el cuarto cuento en una hora responde 429 con mensaje en español', async () => {
    const dev = 'tablet-limite-0009';
    for (let i = 0; i < 3; i++) {
      fake.next.push(iaJson());
      const r = await http().post('/api/cuentos').send(opciones({ deviceId: dev })).expect(202);
      await svc.esperar(r.body.id as string);
    }
    const r = await http().post('/api/cuentos').send(opciones({ deviceId: dev })).expect(429);
    expect(r.body.message).toMatch(/3 cuentos en esta hora/);
    // Otro dispositivo sigue pudiendo.
    fake.next.push(iaJson());
    await http().post('/api/cuentos').send(opciones({ deviceId: 'tablet-otra-0010' })).expect(202);
  });

  it('cuento inexistente → 404; audio inexistente → 404', async () => {
    await http().get('/api/cuentos/noexiste').expect(404);
    await http().get('/api/cuentos/noexiste/audio').expect(404);
  });
});

describe('panel: guardias y revisión', () => {
  let pendienteId: string;
  beforeAll(async () => {
    fake.next.push(iaJson({ titulo: 'El cangrejo azul de Lía' }));
    pendienteId = (await crearYEsperar(opciones({ deviceId: 'tablet-admin-0020' }))).id;
  });

  it('401 sin sesión; LIBRARIAN y ADMIN pueden listar y ver el detalle', async () => {
    await http().get('/api/admin/cuentos').expect(401);
    await http().post(`/api/admin/cuentos/${pendienteId}/revisar`).send({ decision: 'APROBAR' }).expect(401);
    const lista = await http().get('/api/admin/cuentos?status=PENDING_REVIEW').set('Authorization', `Bearer ${libToken}`).expect(200);
    expect(lista.body.some((c: { id: string }) => c.id === pendienteId)).toBe(true);
    const det = await http().get(`/api/admin/cuentos/${pendienteId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(det.body).toMatchObject({ status: 'PENDING_REVIEW', resourceIds: [], proveedor: { ms: 25, tokensEntrada: 300, tokensSalida: 500 } });
    expect(JSON.stringify(det.body)).not.toContain('deviceHash');
    await http().get('/api/admin/cuentos?status=OTRO').set('Authorization', `Bearer ${adminToken}`).expect(400);
  });

  it('aprobar crea un libro EPUB y un audiolibro PUBLICADOS en el catálogo, con licencia del taller y extra.cuentoId', async () => {
    const antes = (await http().get('/api/resources?type=BOOK&pageSize=1').expect(200)).body.total as number;
    const res = await http().post(`/api/admin/cuentos/${pendienteId}/revisar`).set('Authorization', `Bearer ${libToken}`).send({ decision: 'APROBAR', nota: 'Bonito cuento' }).expect(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.resourceIds).toHaveLength(2);
    expect(res.body.reviewNote).toBe('Bonito cuento');
    const [libroId, audioId] = res.body.resourceIds as [string, string];
    const libro = (await http().get(`/api/resources/${libroId}`).expect(200)).body;
    expect(libro).toMatchObject({
      type: 'BOOK', format: 'EPUB', status: 'PUBLISHED', accessible: true, hasFile: true, gradeMin: 1, gradeMax: 3,
      title: 'El cangrejo azul de Lía', creator: 'Sofía (Taller de cuentos)', categories: [...CUENTO_LICENSE.categories],
      license: { rightsHolder: CUENTO_LICENSE.rightsHolder, licenseName: CUENTO_LICENSE.licenseName },
    });
    expect(libro.extra.cuentoId).toBe(pendienteId);
    expect(libro.extra.questions).toHaveLength(3);
    // La ilustración con IA es la portada del libro y del audiolibro (ADR-020).
    expect(libro.hasCover).toBe(true);
    const portada = await http().get(`/api/resources/${libroId}/cover`).buffer().parse(binaryParser).expect(200);
    expect(portada.headers['content-type']).toBe('image/jpeg');
    const audio = (await http().get(`/api/resources/${audioId}`).expect(200)).body;
    expect(audio).toMatchObject({ type: 'AUDIOBOOK', format: 'MP3', status: 'PUBLISHED', title: 'El cangrejo azul de Lía', hasFile: true });
    expect(audio.durationSeconds).toBeGreaterThan(0);
    // Ambos aparecen en el catálogo público y el EPUB es un ZIP con mimetype.
    const despues = (await http().get('/api/resources?type=BOOK&pageSize=1').expect(200)).body.total as number;
    expect(despues).toBe(antes + 1);
    const epub = await http().get(`/api/resources/${libroId}/file`).buffer().parse(binaryParser).expect(200);
    expect(epub.headers['content-type']).toBe('application/epub+zip');
    expect((epub.body as Buffer).subarray(30, 38).toString()).toBe('mimetype');
    // Auditoría y bloqueo de doble revisión.
    const audit = await http().get('/api/admin/audit?limit=10').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const rev = audit.body.find((a: { action: string; entityId: string }) => a.action === 'CUENTO_REVIEW' && a.entityId === pendienteId);
    expect(rev.details).toMatchObject({ decision: 'APROBAR', resourceIds: [libroId, audioId], audio: true, cover: 'ilustracion-ia' });
    await http().post(`/api/admin/cuentos/${pendienteId}/revisar`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'RECHAZAR' }).expect(409);
    // Retirar los recursos no borra el cuento aprobado.
    await http().delete(`/api/admin/resources/${libroId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    await http().delete(`/api/admin/resources/${audioId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    await http().get(`/api/resources/${libroId}`).expect(404);
  });

  it('ocultar la ilustración: deja de servirse al público, el panel la sigue viendo y al aprobar la portada es la tipográfica', async () => {
    fake.next.push(iaJson({ titulo: 'Cuento con dibujo oculto' }));
    const c = await crearYEsperar(opciones({ deviceId: 'tablet-admin-0022' }));
    expect(c.imagen.listo).toBe(true);
    await http().post(`/api/admin/cuentos/${c.id}/imagen`).send({ oculta: true }).expect(401);
    const oc = await http().post(`/api/admin/cuentos/${c.id}/imagen`).set('Authorization', `Bearer ${libToken}`).send({ oculta: true }).expect(200);
    expect(oc.body.imagenAdmin).toMatchObject({ existe: true, oculta: true });
    expect(oc.body.imagen).toEqual({ listo: false, url: null, pendiente: false });
    await http().get(`/api/cuentos/${c.id}/imagen`).expect(404);
    const prev = await http().get(`/api/admin/cuentos/${c.id}/imagen`).set('Authorization', `Bearer ${libToken}`).buffer().parse(binaryParser).expect(200);
    expect(prev.headers['content-type']).toBe('image/jpeg');
    await http().post(`/api/admin/cuentos/${c.id}/imagen`).set('Authorization', `Bearer ${libToken}`).send({ oculta: 'sí' }).expect(400);
    const res = await http().post(`/api/admin/cuentos/${c.id}/revisar`).set('Authorization', `Bearer ${libToken}`).send({ decision: 'APROBAR' }).expect(200);
    const libroId = res.body.resourceIds[0] as string;
    const portada = await http().get(`/api/resources/${libroId}/cover`).buffer().parse(binaryParser).expect(200);
    expect(portada.headers['content-type']).toBe('image/png');
    const audit = await http().get('/api/admin/audit?limit=20').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(audit.body.some((a: { action: string; entityId: string; details: { decision?: string } }) => a.action === 'CUENTO_REVIEW' && a.entityId === c.id && a.details?.decision === 'OCULTAR_ILUSTRACION')).toBe(true);
    for (const rid of res.body.resourceIds as string[]) await http().delete(`/api/admin/resources/${rid}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
  });

  it('rechazar no crea recursos y queda auditado; stats del panel cuentan los cuentos', async () => {
    fake.next.push(iaJson({ titulo: 'Otro cuento' }));
    const c = await crearYEsperar(opciones({ deviceId: 'tablet-admin-0021' }));
    const antes = (await http().get('/api/resources?type=BOOK&pageSize=1')).body.total as number;
    const res = await http().post(`/api/admin/cuentos/${c.id}/revisar`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'RECHAZAR', nota: 'Repite ideas' }).expect(200);
    expect(res.body).toMatchObject({ status: 'REJECTED', resourceIds: [], reviewNote: 'Repite ideas' });
    expect((await http().get('/api/resources?type=BOOK&pageSize=1')).body.total).toBe(antes);
    await http().post(`/api/admin/cuentos/${c.id}/revisar`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'APROBAR' }).expect(409);
    await http().post(`/api/admin/cuentos/${c.id}/revisar`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'QUEMAR' }).expect(400);
    const stats = await http().get('/api/admin/stats').set('Authorization', `Bearer ${libToken}`).expect(200);
    expect(stats.body.cuentos).toMatchObject({ aprobados: 2, rechazados: 1 });
    expect(stats.body.cuentos.pendientes).toBeGreaterThanOrEqual(1);
  });
});

describe('sin motor de voz', () => {
  it('el cuento se completa sin audio (audio.listo=false) y al aprobar solo se crea el libro', async () => {
    const saved = process.env.TTS_PIPER_BIN;
    process.env.TTS_PIPER_BIN = '/nonexistent/piper';
    const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(LLM_PROVIDER).useValue(fake).compile();
    const app2 = mod.createNestApplication({ logger: false });
    app2.setGlobalPrefix('api');
    await app2.init();
    try {
      fake.next.push(iaJson({ titulo: 'Cuento sin voz' }));
      const r = await request(app2.getHttpServer()).post('/api/cuentos').send(opciones({ deviceId: 'tablet-sinvoz-0030' })).expect(202);
      await app2.get(CuentosService).esperar(r.body.id as string);
      const c = (await request(app2.getHttpServer()).get(`/api/cuentos/${r.body.id}`).expect(200)).body;
      expect(c.status).toBe('PENDING_REVIEW');
      expect(c.audio).toMatchObject({ listo: false, url: null, pendiente: false });
      const rev = await request(app2.getHttpServer()).post(`/api/admin/cuentos/${r.body.id}/revisar`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'APROBAR' }).expect(200);
      expect(rev.body.resourceIds).toHaveLength(1);
      await request(app2.getHttpServer()).delete(`/api/admin/resources/${rev.body.resourceIds[0]}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    } finally {
      await app2.close();
      process.env.TTS_PIPER_BIN = saved;
    }
  });
});
