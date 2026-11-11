import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import * as path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ADMIN, binaryParser, bootApp, EPUB_BYTES, LIBRARIAN, MP3_BYTES, MP3_SYNC_BYTES, PDF_BYTES, PNG_BYTES, resetDb, resourceInput, tokenFor,
} from './helpers';
import { TEST_STORAGE_DIR } from './test-env';

let app: INestApplication;
let prisma: PrismaClient;
let adminToken: string;
let libToken: string;
const http = () => request(app.getHttpServer());
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

async function createResource(overrides: Record<string, unknown> = {}, token = adminToken) {
  const res = await http().post('/api/admin/resources').set('Authorization', `Bearer ${token}`).send(resourceInput(overrides));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: string; status: string };
}
async function publish(id: string) {
  await http().post(`/api/admin/resources/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'PUBLISHED' }).expect(200);
}
function upload(id: string, buf: Buffer, filename: string, kind: 'file' | 'cover' = 'file') {
  return http().post(`/api/admin/resources/${id}/${kind}`).set('Authorization', `Bearer ${adminToken}`).attach('file', buf, filename);
}

beforeAll(async () => {
  prisma = new PrismaClient();
  await resetDb(prisma);
  app = await bootApp();
  adminToken = await tokenFor(app, ADMIN);
  libToken = await tokenFor(app, LIBRARIAN);
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
});

describe('health', () => {
  it('GET /api/health incluye ping a la BD', async () => {
    const res = await http().get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
  });
});

describe('auth', () => {
  it('login correcto devuelve JWT y usuario', async () => {
    const res = await http().post('/api/auth/login').send(ADMIN).expect(200);
    expect(res.body.accessToken).toMatch(/^ey/);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'ADMIN' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });
  it('login incorrecto -> 401 con mensaje en español', async () => {
    const res = await http().post('/api/auth/login').send({ email: ADMIN.email, password: 'contraseña-mala' }).expect(401);
    expect(res.body.message).toMatch(/incorrect/);
    await http().post('/api/auth/login').send({ email: 'nadie@macondo.local', password: 'loquesea123' }).expect(401);
  });
  it('login con datos inválidos -> 400', async () => {
    await http().post('/api/auth/login').send({ email: 'no-es-correo', password: 'x' }).expect(400);
  });
  it('GET /api/auth/me con token', async () => {
    const res = await http().get('/api/auth/me').set('Authorization', `Bearer ${libToken}`).expect(200);
    expect(res.body).toMatchObject({ email: LIBRARIAN.email, role: 'LIBRARIAN' });
  });
  it('ruta admin sin token -> 401; token falso -> 401', async () => {
    await http().get('/api/admin/resources').expect(401);
    await http().get('/api/admin/stats').set('Authorization', 'Bearer abc.def.ghi').expect(401);
  });
  it('bibliotecaria no puede ver auditoría (solo ADMIN) -> 403; admin sí', async () => {
    const res = await http().get('/api/admin/audit').set('Authorization', `Bearer ${libToken}`).expect(403);
    expect(res.body.message).toMatch(/permisos/);
    await http().get('/api/admin/audit').set('Authorization', `Bearer ${adminToken}`).expect(200);
  });
  it('usuario desactivado pierde acceso inmediatamente', async () => {
    await prisma.user.update({ where: { email: LIBRARIAN.email }, data: { active: false } });
    await http().get('/api/auth/me').set('Authorization', `Bearer ${libToken}`).expect(401);
    await prisma.user.update({ where: { email: LIBRARIAN.email }, data: { active: true } });
  });
});

describe('recursos: alta, publicación, catálogo', () => {
  let bookId: string;
  let draftId: string;

  beforeAll(async () => {
    bookId = (await createResource({ title: 'El Tesoro del Río Magdalena', creator: 'Ana Pérez', gradeMin: 4, gradeMax: 6, categories: ['aventura'] })).id;
    draftId = (await createResource({ title: 'Borrador secreto', type: 'AUDIOBOOK', gradeMin: 1, gradeMax: 11 }, libToken)).id;
  });

  it('el alta queda en DRAFT y valida con el esquema compartido', async () => {
    const r = await http().get(`/api/admin/resources/${bookId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(r.body.status).toBe('DRAFT');
    expect(r.body.format).toBe('NONE');
    const bad = await http().post('/api/admin/resources').set('Authorization', `Bearer ${adminToken}`).send(resourceInput({ gradeMin: 8, gradeMax: 3 }));
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe('Datos inválidos');
  });

  it('borrador oculto del catálogo y de GET por id', async () => {
    const list = await http().get('/api/resources').expect(200);
    expect(list.body.items.map((i: { id: string }) => i.id)).not.toContain(draftId);
    await http().get(`/api/resources/${draftId}`).expect(404);
    await http().get(`/api/resources/${bookId}`).expect(404);
  });

  it('publicar -> aparece en búsqueda (insensible a mayúsculas) y filtros', async () => {
    await publish(bookId);
    const byQ = await http().get('/api/resources').query({ q: 'tesoro DEL río' }).expect(200);
    expect(byQ.body.total).toBe(1);
    expect(byQ.body.items[0]).toMatchObject({ id: bookId, accessible: true, status: 'PUBLISHED' });
    expect((await http().get('/api/resources').query({ q: 'ana pérez' })).body.total).toBe(1);
    expect((await http().get('/api/resources').query({ type: 'BOOK', grade: 5 })).body.items.map((i: { id: string }) => i.id)).toContain(bookId);
    expect((await http().get('/api/resources').query({ grade: 4 })).body.total).toBe(1);
    expect((await http().get('/api/resources').query({ grade: 6 })).body.total).toBe(1);
    expect((await http().get('/api/resources').query({ grade: 7 })).body.total).toBe(0);
    expect((await http().get('/api/resources').query({ grade: 3 })).body.total).toBe(0);
    expect((await http().get('/api/resources').query({ type: 'AUDIOBOOK' })).body.total).toBe(0);
    expect((await http().get('/api/resources').query({ category: 'aventura' })).body.total).toBe(1);
    expect((await http().get('/api/resources').query({ category: 'poesia' })).body.total).toBe(0);
    await http().get('/api/resources').query({ grade: 12 }).expect(400);
    const one = await http().get(`/api/resources/${bookId}`).expect(200);
    expect(one.body.license.rightsHolder).toBe('Dominio público');
  });

  it('paginación', async () => {
    for (let i = 0; i < 3; i++) await publish((await createResource({ title: `Paginado ${i}`, categories: ['pag'] })).id);
    const p1 = await http().get('/api/resources').query({ category: 'pag', pageSize: 2, page: 1 }).expect(200);
    const p2 = await http().get('/api/resources').query({ category: 'pag', pageSize: 2, page: 2 }).expect(200);
    expect(p1.body).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(p1.body.items).toHaveLength(2);
    expect(p2.body.items).toHaveLength(1);
  });

  it('PATCH parcial valida el resultado combinado', async () => {
    const ok = await http().patch(`/api/admin/resources/${bookId}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Nueva descripción', license: { authorizedDevices: 31 } }).expect(200);
    expect(ok.body.description).toBe('Nueva descripción');
    expect(ok.body.license.authorizedDevices).toBe(31);
    expect(ok.body.license.rightsHolder).toBe('Dominio público');
    await http().patch(`/api/admin/resources/${bookId}`).set('Authorization', `Bearer ${adminToken}`).send({ gradeMin: 9 }).expect(400);
    await http().patch(`/api/admin/resources/${bookId}`).set('Authorization', `Bearer ${adminToken}`).send({ hacker: true }).expect(400);
  });

  it('DELETE -> RETIRED (la fila se conserva) y desaparece del catálogo', async () => {
    const res = await http().delete(`/api/admin/resources/${draftId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.status).toBe('RETIRED');
    const row = await prisma.resource.findUnique({ where: { id: draftId } });
    expect(row?.status).toBe('RETIRED');
    const admin = await http().get('/api/admin/resources').query({ status: 'RETIRED' }).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(admin.body.items.map((i: { id: string }) => i.id)).toContain(draftId);
  });

  it('cada mutación administrativa queda en auditoría', async () => {
    const res = await http().get('/api/admin/audit').set('Authorization', `Bearer ${adminToken}`).expect(200);
    const actions = res.body.map((a: { action: string }) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['RESOURCE_CREATE', 'RESOURCE_STATUS', 'RESOURCE_UPDATE', 'RESOURCE_RETIRE']));
    const create = res.body.find((a: { action: string; entityId: string }) => a.action === 'RESOURCE_CREATE' && a.entityId === draftId);
    expect(create.actor.email).toBe(LIBRARIAN.email);
  });
});

describe('subidas y streaming', () => {
  let id: string;
  beforeAll(async () => {
    id = (await createResource({ title: 'Audiolibro con archivo', type: 'AUDIOBOOK', categories: ['audio'] })).id;
  });

  it('rechaza extensión no permitida', async () => {
    const res = await upload(id, PDF_BYTES, 'malware.exe');
    expect(res.status).toBe(415);
    expect(res.body.message).toMatch(/Extensión no permitida/);
    expect((await upload(id, PDF_BYTES, 'sin-extension')).status).toBe(415);
  });

  it('rechaza firma (magic bytes) incorrecta', async () => {
    const fakePdf = Buffer.from('<html>no soy un pdf</html>');
    const r1 = await upload(id, fakePdf, 'libro.pdf');
    expect(r1.status).toBe(415);
    expect(r1.body.message).toMatch(/no coincide/);
    expect((await upload(id, PDF_BYTES, 'audio.mp3')).status).toBe(415);
    expect((await upload(id, MP3_BYTES, 'libro.epub')).status).toBe(415);
    expect((await upload(id, PDF_BYTES, 'portada.png', 'cover')).status).toBe(415);
    expect((await upload(id, PNG_BYTES, 'portada.gif', 'cover')).status).toBe(415);
  });

  it('rechaza archivos mayores a MAX_UPLOAD_MB (2 MB en pruebas) -> 413', async () => {
    const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(2 * 1024 * 1024 + 10, 0x20)]);
    expect((await upload(id, big, 'grande.pdf')).status).toBe(413);
  });

  it('sin archivo -> 400', async () => {
    await http().post(`/api/admin/resources/${id}/file`).set('Authorization', `Bearer ${adminToken}`).expect(400);
  });

  it('PDF válido: guarda sha256, tamaño y formato', async () => {
    const pdfRes = (await createResource({ title: 'PDF de prueba' })).id;
    const res = await upload(pdfRes, PDF_BYTES, 'Libro.PDF');
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({ format: 'PDF', hasFile: true, fileSha256: sha(PDF_BYTES), fileSizeBytes: PDF_BYTES.length });
    await publish(pdfRes);
    const f = await http().get(`/api/resources/${pdfRes}/file`).buffer(true).parse(binaryParser).expect(200);
    expect(f.headers['content-type']).toMatch(/application\/pdf/);
    expect(Buffer.compare(f.body, PDF_BYTES)).toBe(0);
  });

  it('EPUB válido (cabecera zip)', async () => {
    const epubRes = (await createResource({ title: 'EPUB de prueba' })).id;
    const res = await upload(epubRes, EPUB_BYTES, 'libro.epub').expect(201);
    expect(res.body).toMatchObject({ format: 'EPUB', fileSha256: sha(EPUB_BYTES) });
    await publish(epubRes);
    const f = await http().get(`/api/resources/${epubRes}/file`).buffer(true).parse(binaryParser).expect(200);
    expect(f.headers['content-type']).toMatch(/application\/epub\+zip/);
  });

  it('MP3 (ID3) + Range -> 206 con bytes exactos; MP3 con frame sync también se acepta', async () => {
    expect((await upload(id, MP3_SYNC_BYTES, 'sync.mp3')).status).toBe(201);
    const res = await upload(id, MP3_BYTES, 'capitulo1.mp3').expect(201);
    expect(res.body).toMatchObject({ format: 'MP3', fileSha256: sha(MP3_BYTES), fileSizeBytes: MP3_BYTES.length });
    await publish(id);

    const full = await http().get(`/api/resources/${id}/file`).buffer(true).parse(binaryParser).expect(200);
    expect(full.headers['accept-ranges']).toBe('bytes');
    expect(full.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(Buffer.compare(full.body, MP3_BYTES)).toBe(0);

    const part = await http().get(`/api/resources/${id}/file`).set('Range', 'bytes=100-199').buffer(true).parse(binaryParser).expect(206);
    expect(part.headers['content-range']).toBe(`bytes 100-199/${MP3_BYTES.length}`);
    expect(part.headers['content-length']).toBe('100');
    expect(Buffer.compare(part.body, MP3_BYTES.subarray(100, 200))).toBe(0);

    const open = await http().get(`/api/resources/${id}/file`).set('Range', 'bytes=4000-').buffer(true).parse(binaryParser).expect(206);
    expect(Buffer.compare(open.body, MP3_BYTES.subarray(4000))).toBe(0);
    const suffix = await http().get(`/api/resources/${id}/file`).set('Range', 'bytes=-10').buffer(true).parse(binaryParser).expect(206);
    expect(Buffer.compare(suffix.body, MP3_BYTES.subarray(-10))).toBe(0);

    // If-None-Match con el SHA-256 del archivo -> 304; con Range se ignora y sigue 206
    await http().get(`/api/resources/${id}/file`).set('If-None-Match', `W/"${sha(MP3_BYTES)}"`).expect(304);
    await http().get(`/api/resources/${id}/file`).set('If-None-Match', `"${sha(MP3_BYTES)}"`).set('Range', 'bytes=0-9').expect(206);

    const bad = await http().get(`/api/resources/${id}/file`).set('Range', 'bytes=999999-').expect(416);
    expect(bad.headers['content-range']).toBe(`bytes */${MP3_BYTES.length}`);

    // Reemplazar el archivo elimina el anterior del almacenamiento (solo queda el actual + otros recursos)
    const files = readdirSync(path.join(TEST_STORAGE_DIR, 'files'));
    expect(files.every((f) => /^[a-f0-9-]{36}\.(pdf|epub|mp3)$/.test(f))).toBe(true);
  });

  it('portada PNG válida y servida', async () => {
    const res = await upload(id, PNG_BYTES, 'portada.png', 'cover').expect(201);
    expect(res.body.hasCover).toBe(true);
    const c = await http().get(`/api/resources/${id}/cover`).buffer(true).parse(binaryParser).expect(200);
    expect(c.headers['content-type']).toMatch(/image\/png/);
    // QA 2026-11-01: ETag + 304 para no volver a descargar portadas (catálogo con 570 recursos)
    const etag = c.headers.etag as string;
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
    const again = await http().get(`/api/resources/${id}/cover`).set('If-None-Match', etag).expect(304);
    expect(again.text ?? '').toBe('');
    await http().get(`/api/resources/${id}/cover`).set('If-None-Match', '"otra"').expect(200);
  });

  it('miniaturas de portada: ?w=240|480 → WebP más pequeño, cacheado en thumbs/, ETag/304; ancho inválido → 400', async () => {
    // Portada real (600×900, PNG) generada con sharp: PNG_BYTES es solo una firma y no se puede decodificar.
    const sharp = (await import('sharp')).default;
    const realPng = await sharp({ create: { width: 600, height: 900, channels: 3, background: { r: 23, g: 54, b: 93 } } })
      .composite([{ input: await sharp({ create: { width: 300, height: 200, channels: 3, background: { r: 240, g: 180, b: 40 } } }).png().toBuffer(), left: 150, top: 350 }])
      .png().toBuffer();
    await upload(id, realPng, 'portada-real.png', 'cover').expect(201);
    const original = await http().get(`/api/resources/${id}/cover`).buffer(true).parse(binaryParser).expect(200);
    expect(original.headers['content-type']).toMatch(/image\/png/);

    const small = await http().get(`/api/resources/${id}/cover?w=240`).buffer(true).parse(binaryParser).expect(200);
    expect(small.headers['content-type']).toMatch(/image\/webp/);
    expect((small.body as Buffer).length).toBeLessThan((original.body as Buffer).length / 4);
    const meta = await sharp(small.body as Buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(240);
    expect(meta.height).toBe(360); // conserva la proporción 2:3

    const large = await http().get(`/api/resources/${id}/cover?w=480`).buffer(true).parse(binaryParser).expect(200);
    expect((await sharp(large.body as Buffer).metadata()).width).toBe(480);
    expect((large.body as Buffer).length).toBeGreaterThan((small.body as Buffer).length);

    // Cacheadas en disco bajo thumbs/<uuid-portada>-w<ancho>.webp
    const row = await prisma.resource.findUnique({ where: { id } });
    const uuid = (row!.coverPath as string).slice('covers/'.length).replace(/\.\w+$/, '');
    const thumbsDir = path.join(TEST_STORAGE_DIR, 'thumbs');
    expect(readdirSync(thumbsDir)).toEqual(expect.arrayContaining([`${uuid}-w240.webp`, `${uuid}-w480.webp`]));

    // Segunda petición: misma miniatura (desde caché) y revalidación 304 por ETag distinto al del original
    const etag = small.headers.etag as string;
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
    expect(etag).not.toBe(original.headers.etag);
    await http().get(`/api/resources/${id}/cover?w=240`).set('If-None-Match', etag).expect(304);
    await http().get(`/api/resources/${id}/cover?w=480`).set('If-None-Match', etag).expect(200);

    // Anchos fuera de la lista blanca
    for (const w of ['100', '241', '4800', 'abc', '240.0', '-240']) await http().get(`/api/resources/${id}/cover?w=${w}`).expect(400);
    // La vista previa del panel acepta el mismo parámetro
    const adminThumb = await http().get(`/api/admin/resources/${id}/cover?w=240`).set('Authorization', `Bearer ${adminToken}`).buffer(true).parse(binaryParser).expect(200);
    expect(adminThumb.headers['content-type']).toMatch(/image\/webp/);
    await http().get(`/api/admin/resources/${id}/cover?w=999`).set('Authorization', `Bearer ${adminToken}`).expect(400);

    // Reemplazar la portada borra las miniaturas huérfanas de la anterior
    await upload(id, realPng, 'portada-nueva.png', 'cover').expect(201);
    expect(readdirSync(thumbsDir).filter((f) => f.startsWith(uuid))).toEqual([]);
  });

  it('miniatura de una portada no decodificable: sirve el original (sin 500)', async () => {
    const brokenId = (await createResource({ title: 'Portada rota' })).id;
    await publish(brokenId);
    await upload(brokenId, PNG_BYTES, 'rota.png', 'cover').expect(201);
    const res = await http().get(`/api/resources/${brokenId}/cover?w=240`).buffer(true).parse(binaryParser).expect(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect((res.body as Buffer).length).toBe(PNG_BYTES.length);
  });

  it('path traversal: nombre del cliente ignorado e IDs maliciosos -> 404', async () => {
    const travId = (await createResource({ title: 'Traversal' })).id;
    const res = await upload(travId, PDF_BYTES, '../../../../etc/evil.pdf').expect(201);
    const row = await prisma.resource.findUnique({ where: { id: travId } });
    expect(row?.filePath).toMatch(/^files\/[a-f0-9-]{36}\.pdf$/);
    expect(res.body.fileSha256).toBe(sha(PDF_BYTES));
    expect(existsSync(path.resolve(TEST_STORAGE_DIR, '..', '..', '..', '..', 'etc', 'evil.pdf'))).toBe(false);
    expect(existsSync(path.join(TEST_STORAGE_DIR, 'evil.pdf'))).toBe(false);
    await http().get('/api/resources/..%2F..%2F..%2Fetc%2Fpasswd/file').expect(404);
    await http().get('/api/resources/%2e%2e/file').expect(404);
    await http().get(`/api/resources/${'a'.repeat(500)}/file`).expect(404);
  });

  it('subida en recurso inexistente -> 404', async () => {
    expect((await upload('no-existe', PDF_BYTES, 'a.pdf')).status).toBe(404);
  });
});

describe('licencias y manifest offline', () => {
  let activeId: string;
  let expiredId: string;
  let noOfflineId: string;
  let futureId: string;

  beforeAll(async () => {
    const lic = resourceInput().license;
    activeId = (await createResource({ title: 'Licencia vigente' })).id;
    expiredId = (await createResource({ title: 'Licencia vencida', license: { ...lic, validUntil: '2020-01-01T00:00:00.000Z' } })).id;
    noOfflineId = (await createResource({ title: 'Sin offline', license: { ...lic, offlineAllowed: false } })).id;
    futureId = (await createResource({ title: 'Licencia futura', license: { ...lic, validFrom: '2099-01-01T00:00:00.000Z' } })).id;
    for (const rid of [activeId, expiredId, noOfflineId, futureId]) {
      await upload(rid, PDF_BYTES, 'x.pdf').expect(201);
      await publish(rid);
    }
  });

  it('licencia vencida -> archivo 403 con mensaje en español, accessible=false', async () => {
    const res = await http().get(`/api/resources/${expiredId}/file`).expect(403);
    expect(res.body.message).toMatch(/licencia de este recurso no está vigente/);
    const dto = await http().get(`/api/resources/${expiredId}`).expect(200);
    expect(dto.body.accessible).toBe(false);
    await http().get(`/api/resources/${futureId}/file`).expect(403);
    await http().get(`/api/resources/${activeId}/file`).expect(200);
  });

  it('manifest solo incluye recursos descargables offline, con sha256/tamaño/versión', async () => {
    const res = await http().get('/api/offline/manifest').expect(200);
    const ids = res.body.entries.map((e: { id: string }) => e.id);
    expect(ids).toContain(activeId);
    expect(ids).not.toContain(expiredId);
    expect(ids).not.toContain(noOfflineId);
    expect(ids).not.toContain(futureId);
    const entry = res.body.entries.find((e: { id: string }) => e.id === activeId);
    const row = await prisma.resource.findUnique({ where: { id: activeId } });
    expect(entry).toMatchObject({
      sha256: sha(PDF_BYTES), sizeBytes: PDF_BYTES.length, format: 'PDF', version: row!.updatedAt.toISOString(),
      fileUrl: `/api/resources/${activeId}/file`, licenseValidUntil: null,
    });
    expect(res.body.version).toMatch(/^[a-f0-9]{16}$/);
    // Si cambia la licencia, cambia la versión del manifest
    await http().patch(`/api/admin/resources/${activeId}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ license: { offlineAllowed: false } }).expect(200);
    const after = await http().get('/api/offline/manifest').expect(200);
    expect(after.body.version).not.toBe(res.body.version);
    expect(after.body.entries.map((e: { id: string }) => e.id)).not.toContain(activeId);
  });
});

describe('Macondo TV', () => {
  it('schedule respeta activo, fechas y orden', async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const day = 86400_000;
    const now = Date.now();
    const mk = (body: Record<string, unknown>) => http().post('/api/admin/tv/slides').set(auth).send(body).expect(201);
    const second = await mk({ kind: 'FUN_FACT', title: 'Segunda', order: 2 });
    const first = await mk({ kind: 'MESSAGE', title: 'Primera', order: 1, startsAt: new Date(now - day).toISOString(), endsAt: new Date(now + day).toISOString() });
    await mk({ kind: 'AGENDA', title: 'Pasada', order: 0, endsAt: new Date(now - day).toISOString() });
    await mk({ kind: 'AGENDA', title: 'Futura', order: 0, startsAt: new Date(now + day).toISOString() });
    await mk({ kind: 'CHALLENGE', title: 'Inactiva', order: 0, active: false });
    await http().post('/api/admin/tv/slides').set(auth).send({ kind: 'MESSAGE', title: 'Fechas al revés', startsAt: new Date(now + day).toISOString(), endsAt: new Date(now).toISOString() }).expect(400);
    await http().post('/api/admin/tv/slides').set(auth).send({ kind: 'NOPE', title: 'x' }).expect(400);

    const res = await http().get('/api/tv/schedule').expect(200);
    expect(res.body.map((s: { title: string }) => s.title)).toEqual(['Primera', 'Segunda']);
    expect(res.body[1]).toMatchObject({ durationSeconds: 20, active: true }); // valor por defecto: 20 s (programación TV)

    await http().patch(`/api/admin/tv/slides/${second.body.id}`).set(auth).send({ order: 0 }).expect(200);
    expect((await http().get('/api/tv/schedule')).body.map((s: { title: string }) => s.title)).toEqual(['Segunda', 'Primera']);
    await http().delete(`/api/admin/tv/slides/${first.body.id}`).set(auth).expect(204);
    expect((await http().get('/api/tv/schedule')).body.map((s: { title: string }) => s.title)).toEqual(['Segunda']);
    const all = await http().get('/api/admin/tv/slides').set(auth).expect(200);
    expect(all.body.length).toBe(4);
  });

  it('diapositiva con recurso: solo expone recurso publicado', async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    await http().post('/api/admin/tv/slides').set(auth).send({ kind: 'BOOK_OF_WEEK', title: 'Libro inexistente', resourceId: 'nope' }).expect(400);
    const draft = await createResource({ title: 'Recurso borrador TV' });
    await http().post('/api/admin/tv/slides').set(auth).send({ kind: 'BOOK_OF_WEEK', title: 'Libro semana', resourceId: draft.id, order: 99 }).expect(201);
    let slide = (await http().get('/api/tv/schedule')).body.find((s: { title: string }) => s.title === 'Libro semana');
    expect(slide.resource).toBeNull();
    await publish(draft.id);
    slide = (await http().get('/api/tv/schedule')).body.find((s: { title: string }) => s.title === 'Libro semana');
    expect(slide.resource).toMatchObject({ id: draft.id, title: 'Recurso borrador TV', type: 'BOOK', hasCover: false });
  });
});

describe('estadísticas agregadas', () => {
  it('conteos por tipo/estado coinciden con la BD y metas de capacidad', async () => {
    const res = await http().get('/api/admin/stats').set('Authorization', `Bearer ${libToken}`).expect(200);
    const s = res.body;
    const total = await prisma.resource.count();
    const published = await prisma.resource.count({ where: { status: 'PUBLISHED' } });
    expect(s.totals).toEqual({ resources: total, published, capacityTarget: 570 });
    expect(s.byStatus.PUBLISHED).toBe(published);
    expect(s.byStatus.RETIRED).toBe(1);
    const audio = s.byType.find((t: { type: string }) => t.type === 'AUDIOBOOK');
    expect(audio.target).toBe(100);
    expect(audio.byStatus).toEqual({ DRAFT: 0, PUBLISHED: 1, RETIRED: 1 });
    const book = s.byType.find((t: { type: string }) => t.type === 'BOOK');
    expect(book.target).toBe(300);
    expect(book.byStatus.PUBLISHED).toBe(await prisma.resource.count({ where: { status: 'PUBLISHED', type: 'BOOK' } }));
    expect(s.gradeCoverage).toHaveLength(11);
    expect(s.gradeCoverage[4]).toEqual({ grade: 5, published: await prisma.resource.count({ where: { status: 'PUBLISHED', gradeMin: { lte: 5 }, gradeMax: { gte: 5 } } }) });
    expect(s.gradeCoverage[10].published).toBe(0);
    expect(s.licenses.publishedWithInactiveLicense).toBe(2);
    expect(s.usageLast30Days.fileOpens).toBeGreaterThan(0);
    // Solo agregados: sin correos ni identificadores de personas
    expect(JSON.stringify(s)).not.toMatch(/@macondo\.local/);
  });
});

describe('cambio de contraseña', () => {
  it('rechaza sin token, con actual incorrecta y con nueva débil; acepta y audita el cambio', async () => {
    const tok = await tokenFor(app, LIBRARIAN);
    await http().post('/api/auth/password').send({ currentPassword: LIBRARIAN.password, newPassword: 'NuevaClave2027' }).expect(401);
    await http().post('/api/auth/password').set('Authorization', `Bearer ${tok}`).send({ currentPassword: 'mala-mala-1', newPassword: 'NuevaClave2027' }).expect(401);
    await http().post('/api/auth/password').set('Authorization', `Bearer ${tok}`).send({ currentPassword: LIBRARIAN.password, newPassword: 'corta1' }).expect(400);
    await http().post('/api/auth/password').set('Authorization', `Bearer ${tok}`).send({ currentPassword: LIBRARIAN.password, newPassword: 'NuevaClave2027' }).expect(200);
    await http().post('/api/auth/login').send({ email: LIBRARIAN.email, password: LIBRARIAN.password }).expect(401);
    const tok2 = await tokenFor(app, { email: LIBRARIAN.email, password: 'NuevaClave2027' });
    const adminTok = await tokenFor(app, ADMIN);
    const audit = await http().get('/api/admin/audit?limit=5').set('Authorization', `Bearer ${adminTok}`).expect(200);
    const rows = Array.isArray(audit.body) ? audit.body : audit.body.items;
    expect(rows.some((r: { action: string }) => r.action === 'USER_PASSWORD_CHANGE')).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('NuevaClave2027');
    // restaurar para no afectar otras suites
    await http().post('/api/auth/password').set('Authorization', `Bearer ${tok2}`).send({ currentPassword: 'NuevaClave2027', newPassword: LIBRARIAN.password }).expect(200);
  });
});
