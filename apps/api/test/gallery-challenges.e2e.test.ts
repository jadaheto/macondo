import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, binaryParser, bootApp, galleryJson, LIBRARIAN, makeZip, PDF_BYTES, pngN, resetDb, resourceInput, tokenFor } from './helpers';

let app: INestApplication;
let prisma: PrismaClient;
let adminToken: string;
let libToken: string;
const http = () => request(app.getHttpServer());
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const auth = (t = adminToken) => ({ Authorization: `Bearer ${t}` });

async function createResource(overrides: Record<string, unknown> = {}) {
  const res = await http().post('/api/admin/resources').set(auth()).send(resourceInput(overrides));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: string; status: string; extra: unknown };
}
const publish = (id: string) => http().post(`/api/admin/resources/${id}/status`).set(auth()).send({ status: 'PUBLISHED' }).expect(200);
const upload = (id: string, buf: Buffer, filename = 'galeria.zip') => http().post(`/api/admin/resources/${id}/file`).set(auth()).attach('file', buf, filename);
const gallery = (overrides: Record<string, unknown> = {}) => createResource({ title: 'Galería de prueba', type: 'GALLERY', ...overrides });

const FILES = ['01-a.png', '02-b.png', '03-c.png'];
const validZip = () => makeZip([
  { name: 'fauna-prueba/', data: '' },
  { name: 'fauna-prueba/gallery.json', data: galleryJson(FILES), deflate: true },
  ...FILES.map((f, i) => ({ name: `fauna-prueba/${f}`, data: pngN(i), deflate: i === 0 })),
]);

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

describe('galerías (IMAGE_SET)', () => {
  it('ZIP válido: se acepta, guarda sha256 del ZIP y sirve galería, imágenes y manifest offline', async () => {
    const g = await gallery();
    const zip = validZip();
    const res = await upload(g.id, zip);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({ format: 'IMAGE_SET', hasFile: true, fileSha256: sha(zip), fileSizeBytes: zip.length });

    await http().get(`/api/resources/${g.id}/gallery`).expect(404); // borrador: no visible
    await publish(g.id);
    const dto = await http().get(`/api/resources/${g.id}/gallery`).expect(200);
    expect(dto.body.title).toBe('Fauna de prueba');
    expect(dto.body.items).toHaveLength(3);
    expect(dto.body.items[1]).toMatchObject({ url: `/api/resources/${g.id}/gallery/1`, alt: 'Imagen 2', credit: 'Autora de prueba', license: 'CC BY 4.0', sha256: sha(pngN(1)) });
    expect(dto.body.activity.questions).toHaveLength(1);
    expect(JSON.stringify(dto.body)).not.toMatch(/galleries\//); // nunca expone claves internas

    const img = await http().get(`/api/resources/${g.id}/gallery/2`).buffer(true).parse(binaryParser).expect(200);
    expect(img.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(img.body as Buffer, pngN(2))).toBe(0);
    await http().get(`/api/resources/${g.id}/gallery/3`).expect(404);
    await http().get(`/api/resources/${g.id}/gallery/../file`).expect(404);

    const man = await http().get('/api/offline/manifest').expect(200);
    const entry = man.body.entries.find((e: { id: string }) => e.id === g.id);
    expect(entry).toMatchObject({ format: 'IMAGE_SET', sha256: sha(zip), galleryUrl: `/api/resources/${g.id}/gallery` });
    expect(entry.assets).toHaveLength(3);
    expect(entry.assets[0]).toMatchObject({ url: `/api/resources/${g.id}/gallery/0`, sha256: sha(pngN(0)), mime: 'image/png' });

    // Volver a subir reemplaza las imágenes anteriores
    const again = await upload(g.id, validZip());
    expect(again.status).toBe(201);
  });

  it('rechaza path traversal, rutas absolutas, symlinks y subcarpetas', async () => {
    const g = await gallery();
    const cases = [
      makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, { name: 'a.png', data: pngN(1) }, { name: '../evil.png', data: pngN(2) }]),
      makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, { name: 'a.png', data: pngN(1) }, { name: '/etc/evil.png', data: pngN(2) }]),
      makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, { name: 'a.png', data: pngN(1) }, { name: 'x\\..\\evil.png', data: pngN(2) }]),
      makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, { name: 'a.png', data: '/etc/passwd', symlink: true }]),
      makeZip([{ name: 'g/gallery.json', data: galleryJson(['a.png']) }, { name: 'g/a.png', data: pngN(1) }, { name: 'g/sub/b.png', data: pngN(2) }]),
    ];
    for (const [i, zip] of cases.entries()) {
      const res = await upload(g.id, zip);
      expect(res.status, `caso ${i}: ${JSON.stringify(res.body)}`).toBe(400);
    }
    const row = await prisma.resource.findUnique({ where: { id: g.id } });
    expect(row?.filePath).toBeNull();
  });

  it('rechaza imagen con firma falsa (415) y gallery.json ausente o inválido (400)', async () => {
    const g = await gallery();
    const bad = await upload(g.id, makeZip([{ name: 'gallery.json', data: galleryJson(['a.png', 'b.png']) }, { name: 'a.png', data: pngN(1) }, { name: 'b.png', data: '<html>no</html>' }]));
    expect(bad.status).toBe(415);
    expect(bad.body.message).toMatch(/b\.png/);
    const missing = await upload(g.id, makeZip([{ name: 'a.png', data: pngN(1) }]));
    expect(missing.status).toBe(400);
    expect(missing.body.message).toMatch(/gallery\.json/);
    const notRef = await upload(g.id, makeZip([{ name: 'gallery.json', data: galleryJson(['zz.png']) }, { name: 'a.png', data: pngN(1) }]));
    expect(notRef.status).toBe(400);
    const badJson = await upload(g.id, makeZip([{ name: 'gallery.json', data: '{"title": "x", "items": [' }, { name: 'a.png', data: pngN(1) }]));
    expect(badJson.status).toBe(400);
    const badSchema = await upload(g.id, makeZip([{ name: 'gallery.json', data: JSON.stringify({ title: 'x', items: [{ file: 'a.png' }] }) }, { name: 'a.png', data: pngN(1) }]));
    expect(badSchema.status).toBe(400);
    expect(badSchema.body.message).toMatch(/alt|credit/);
  });

  it('rechaza más de 60 entradas, bombas por proporción y archivos que no son ZIP', async () => {
    const g = await gallery();
    const many = makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, ...Array.from({ length: 61 }, (_, i) => ({ name: `${i}.png`, data: pngN(i) }))]);
    expect((await upload(g.id, many)).status).toBe(400);
    const bomb = makeZip([{ name: 'gallery.json', data: galleryJson(['a.png']) }, { name: 'a.png', data: pngN(1) }, { name: 'zeros.bin', data: Buffer.alloc(8 * 1024 * 1024), deflate: true }]);
    const b = await upload(g.id, bomb);
    expect(b.status).toBe(400);
    expect(b.body.message).toMatch(/bomba|descomprimido/);
    expect((await upload(g.id, Buffer.from('PK\u0003\u0004 basura sin directorio'), 'g.zip')).status).toBe(415);
  });

  it('ZIP solo para galerías; galerías solo como ZIP', async () => {
    const book = await createResource({ title: 'Libro no galería' });
    expect((await upload(book.id, validZip())).status).toBe(415);
    const g = await gallery();
    expect((await upload(g.id, PDF_BYTES, 'libro.pdf')).status).toBe(415);
  });

  it('galería con licencia vencida -> 403 (JSON e imagen) y fuera del manifest', async () => {
    const g = await gallery({ license: { ...resourceInput().license, validUntil: '2020-01-01T00:00:00.000Z' } });
    expect((await upload(g.id, validZip())).status).toBe(201);
    await publish(g.id);
    const res = await http().get(`/api/resources/${g.id}/gallery`).expect(403);
    expect(res.body.message).toMatch(/licencia/);
    await http().get(`/api/resources/${g.id}/gallery/0`).expect(403);
    const man = await http().get('/api/offline/manifest').expect(200);
    expect(man.body.entries.map((e: { id: string }) => e.id)).not.toContain(g.id);
  });
});

describe('extras de recurso', () => {
  it('create y patch aceptan extra (timeline, funFacts, questions, text, relatedTitle)', async () => {
    const extra = { timeline: [{ year: 1867, event: 'Nace' }], funFacts: ['Dato'], questions: [{ prompt: '¿?', options: ['a', 'b'], answer: 0, explanation: '' }], text: 'Texto', relatedTitle: 'Obra' };
    const r = await createResource({ title: 'Biografía con extras', type: 'AUDIOBIOGRAPHY', extra });
    expect(r.extra).toMatchObject(extra);
    const p = await http().patch(`/api/admin/resources/${r.id}`).set(auth()).send({ extra: { funFacts: ['Otro'] } }).expect(200);
    expect(p.body.extra).toEqual({ funFacts: ['Otro'] });
    const kept = await http().patch(`/api/admin/resources/${r.id}`).set(auth()).send({ description: 'x' }).expect(200);
    expect(kept.body.extra).toEqual({ funFacts: ['Otro'] });
    await http().patch(`/api/admin/resources/${r.id}`).set(auth()).send({ extra: { timeline: [{ year: 'x' }] } }).expect(400);
    const cleared = await http().patch(`/api/admin/resources/${r.id}`).set(auth()).send({ extra: null }).expect(200);
    expect(cleared.body.extra).toBeNull();
  });
});

describe('retos lectores', () => {
  let bookId: string;
  const q = { prompt: '¿Quién?', options: ['A', 'B', 'C'], answer: 1, explanation: 'B.' };
  const sample = () => [
    { id: 'reto-trivia', kind: 'trivia', title: 'Trivia', source: 'Esopo', bands: ['1-3', '4-5'], text: 'Texto', questions: [q], resource: { title: 'Fábulas de prueba', creator: 'Esopo' } },
    { id: 'reto-secuencia', kind: 'sequence', title: 'Secuencia', source: 'Esopo', bands: ['4-5'], text: 'Ordena', steps: ['uno', 'dos', 'tres'] },
    { id: 'reto-relacionar', kind: 'match', title: 'Relacionar', source: 'Esopo', bands: ['6-8', '9-11'], text: 'Une', pairs: [{ left: 'Liebre', right: 'Rápida' }, { left: 'Tortuga', right: 'Constante' }], resource: { title: 'No existe', creator: 'Nadie' } },
  ];

  beforeAll(async () => {
    bookId = (await createResource({ title: 'Fábulas de prueba', creator: 'Esopo' })).id;
  });

  it('importa idempotentemente por id, resuelve el recurso por título+autor y audita', async () => {
    await http().post('/api/admin/challenges/import').send(sample()).expect(401);
    const first = await http().post('/api/admin/challenges/import').set(auth(libToken)).send(sample()).expect(200);
    expect(first.body).toEqual({ created: 3, updated: 0, unresolved: ['reto-relacionar'], total: 3 });
    const second = await http().post('/api/admin/challenges/import').set(auth()).send(sample()).expect(200);
    expect(second.body).toMatchObject({ created: 0, updated: 3 });
    expect(await prisma.challenge.count()).toBe(3);
    const audit = await http().get('/api/admin/audit').set(auth()).expect(200);
    expect(audit.body.map((a: { action: string }) => a.action)).toContain('CHALLENGE_IMPORT');
  });

  it('valida el formato (400) con el esquema compartido', async () => {
    await http().post('/api/admin/challenges/import').set(auth()).send([{ id: 'x', kind: 'trivia', title: 't', bands: ['1-3'], questions: [{ ...q, answer: 7 }] }]).expect(400);
    await http().post('/api/admin/challenges/import').set(auth()).send([{ id: 'Mal Id', kind: 'match', title: 't', bands: ['1-3'], pairs: [] }]).expect(400);
    await http().post('/api/admin/challenges/import').set(auth()).send({}).expect(400);
  });

  it('público: solo activos, filtros por banda y recurso; enlaza solo recursos publicados', async () => {
    const all = await http().get('/api/challenges').expect(200);
    expect(all.body).toHaveLength(3);
    const trivia = all.body.find((c: { id: string }) => c.id === 'reto-trivia');
    expect(trivia).toMatchObject({ kind: 'trivia', questions: [q], resource: null }); // libro aún en borrador
    const match = all.body.find((c: { id: string }) => c.id === 'reto-relacionar');
    expect(match.pairs).toHaveLength(2);
    expect((await http().get('/api/challenges').query({ band: '4-5' })).body.map((c: { id: string }) => c.id).sort()).toEqual(['reto-secuencia', 'reto-trivia']);
    expect((await http().get('/api/challenges').query({ band: '9-11' })).body.map((c: { id: string }) => c.id)).toEqual(['reto-relacionar']);
    await http().get('/api/challenges').query({ band: '7' }).expect(400);
    await publish(bookId);
    const byRes = await http().get('/api/challenges').query({ resourceId: bookId }).expect(200);
    expect(byRes.body.map((c: { id: string }) => c.id)).toEqual(['reto-trivia']);
    expect(byRes.body[0].resource).toMatchObject({ id: bookId, title: 'Fábulas de prueba' });
  });

  it('activar/desactivar con auditoría; admin ve todos', async () => {
    const off = await http().post('/api/admin/challenges/reto-secuencia/active').set(auth()).send({ active: false }).expect(200);
    expect(off.body.active).toBe(false);
    expect((await http().get('/api/challenges')).body.map((c: { id: string }) => c.id)).not.toContain('reto-secuencia');
    expect((await http().get('/api/admin/challenges').set(auth()).expect(200)).body).toHaveLength(3);
    // reimportar conserva el estado inactivo
    await http().post('/api/admin/challenges/import').set(auth()).send(sample()).expect(200);
    expect((await http().get('/api/challenges')).body.map((c: { id: string }) => c.id)).not.toContain('reto-secuencia');
    await http().post('/api/admin/challenges/no-existe/active').set(auth()).send({ active: true }).expect(404);
    const audit = await http().get('/api/admin/audit').set(auth()).expect(200);
    expect(audit.body.map((a: { action: string }) => a.action)).toContain('CHALLENGE_TOGGLE');
    const stats = await http().get('/api/admin/stats').set(auth()).expect(200);
    expect(stats.body.challenges).toEqual({ active: 2, total: 3, target: 100 });
  });
});

describe('Macondo TV: tipo TUTORIAL y recurso con sinopsis', () => {
  it('crea diapositiva TUTORIAL (20 s por defecto) y el horario expone portada/sinopsis solo de publicados', async () => {
    const book = await createResource({ title: 'Libro para TV', description: 'Sinopsis para la pantalla.' });
    await publish(book.id);
    const tut = await http().post('/api/admin/tv/slides').set(auth()).send({ kind: 'TUTORIAL', title: 'Cómo usar el kiosco', body: 'Paso 1\nPaso 2', order: 5 }).expect(201);
    expect(tut.body).toMatchObject({ kind: 'TUTORIAL', durationSeconds: 20 });
    await http().post('/api/admin/tv/slides').set(auth()).send({ kind: 'BOOK_OF_WEEK', title: 'Libro de la semana', resourceId: book.id, order: 0 }).expect(201);
    await http().post('/api/admin/tv/slides').set(auth()).send({ kind: 'NO_EXISTE', title: 'x' }).expect(400);
    const sched = await http().get('/api/tv/schedule').expect(200);
    const kinds = sched.body.map((s: { kind: string }) => s.kind);
    expect(kinds).toEqual(expect.arrayContaining(['TUTORIAL', 'BOOK_OF_WEEK']));
    const bw = sched.body.find((s: { kind: string }) => s.kind === 'BOOK_OF_WEEK');
    expect(bw.resource).toMatchObject({ id: book.id, title: 'Libro para TV', description: 'Sinopsis para la pantalla.' });
  });
});
