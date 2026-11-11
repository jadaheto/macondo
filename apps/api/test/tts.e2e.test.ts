/**
 * Narración sintética de extremo a extremo con binarios SIMULADOS (sin Piper instalado):
 * un «piper» que escribe un WAV de silencio proporcional al texto y un «lame» que escribe un MP3 falso.
 * Cubre: estado del motor, 503 sin motor, validaciones, reemplazo del archivo, crédito de voz, auditoría y Range.
 */
import type { INestApplication } from '@nestjs/common';
import { TTS_VOICE_CREDIT } from '@macondo/shared';
import { PrismaClient } from '@prisma/client';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { ADMIN, binaryParser, bootApp, EPUB_BYTES, LIBRARIAN, resetDb, resourceInput, tokenFor } from './helpers';
import { TEST_STORAGE_DIR } from './test-env';
import { FAKE_MP3 } from './tts-fixtures';

let app: INestApplication;
let prisma: PrismaClient;
let adminToken: string;
let libToken: string;
let dir: string;
const savedEnv: Record<string, string | undefined> = {};
const http = () => request(app.getHttpServer());

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'macondo-tts-e2e-'));
  const voice = path.join(dir, 'es_ES-prueba-medium.onnx');
  writeFileSync(voice, 'modelo');
  writeFileSync(`${voice}.json`, '{}');
  // «piper» simulado: lee stdin y escribe un WAV (0,05 s por carácter) en el argumento que sigue a -f.
  const piperJs = path.join(dir, 'fake-piper.cjs');
  writeFileSync(piperJs, `
    const fs = require('fs');
    const args = process.argv.slice(2);
    const out = args[args.indexOf('-f') + 1];
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { input += d; });
    process.stdin.on('end', () => {
      const chars = input.replace(/\\s+/g, ' ').trim().length;
      const sr = 22050, n = Math.round(chars * 0.05 * sr);
      const h = Buffer.alloc(44);
      h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
      h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
      h.write('data', 36); h.writeUInt32LE(n * 2, 40);
      fs.writeFileSync(out, Buffer.concat([h, Buffer.alloc(n * 2)]));
    });
  `);
  const piperBin = path.join(dir, 'piper');
  writeFileSync(piperBin, `#!/bin/sh\nexec "${process.execPath}" "${piperJs}" "$@"\n`, { mode: 0o755 });
  const mp3File = path.join(dir, 'fake.mp3');
  writeFileSync(mp3File, FAKE_MP3);
  const lameBin = path.join(dir, 'lame');
  writeFileSync(lameBin, `#!/bin/sh\nfor last; do :; done\ncp "${mp3File}" "$last"\n`, { mode: 0o755 });
  for (const k of ['TTS_ENABLED', 'TTS_ENGINE', 'TTS_PIPER_BIN', 'TTS_VOICE', 'TTS_MP3_BIN']) savedEnv[k] = process.env[k];
  process.env.TTS_ENABLED = 'true';
  process.env.TTS_ENGINE = 'piper';
  process.env.TTS_PIPER_BIN = piperBin;
  process.env.TTS_VOICE = voice;
  process.env.TTS_MP3_BIN = lameBin;

  prisma = new PrismaClient();
  await resetDb(prisma);
  app = await bootApp();
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

async function createResource(overrides: Record<string, unknown> = {}) {
  const res = await http().post('/api/admin/resources').set('Authorization', `Bearer ${adminToken}`).send(resourceInput(overrides));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: string };
}

describe('GET /api/admin/tts/estado', () => {
  it('requiere sesión', async () => {
    await http().get('/api/admin/tts/estado').expect(401);
  });
  it('bibliotecario y admin ven el estado del motor', async () => {
    const res = await http().get('/api/admin/tts/estado').set('Authorization', `Bearer ${libToken}`).expect(200);
    expect(res.body).toEqual({ enabled: true, engine: 'piper', voice: 'es_ES-prueba-medium', ok: true, detail: null });
  });
});

describe('POST /api/admin/resources/:id/narrar', () => {
  it('sin texto → 400; galería → 400; recurso con EPUB → 400', async () => {
    const sinTexto = await createResource({ type: 'AUDIOSUMMARY' });
    const r1 = await http().post(`/api/admin/resources/${sinTexto.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({}).expect(400);
    expect(r1.body.message).toMatch(/no tiene texto/);
    const galeria = await createResource({ type: 'GALLERY' });
    await http().post(`/api/admin/resources/${galeria.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({ text: 'Hola' }).expect(400);
    const libro = await createResource({ type: 'BOOK' });
    await http().post(`/api/admin/resources/${libro.id}/file`).set('Authorization', `Bearer ${adminToken}`).attach('file', EPUB_BYTES, 'libro.epub').expect(201);
    const r3 = await http().post(`/api/admin/resources/${libro.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({ text: 'Hola' }).expect(400);
    expect(r3.body.message).toMatch(/EPUB/);
    await http().post(`/api/admin/resources/${libro.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({ text: 'x'.repeat(40_001) }).expect(400);
    await http().post(`/api/admin/resources/${libro.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({ velocidad: 2 }).expect(400);
  });

  it('narra extra.text, reemplaza el MP3, acredita la voz, actualiza la licencia y audita (LIBRARIAN también)', async () => {
    const texto = 'Rafael Pombo nació en Bogotá en 1833.\n\nEscribió fábulas para niños.';
    const r = await createResource({
      type: 'AUDIOBIOGRAPHY',
      narrator: 'Voz sintética (macOS, Paulina) — solo demostración',
      license: { ...resourceInput().license as object, rightsHolder: 'Biblioteca Macondo', licenseName: 'Contenido propio; voz sintética Piper es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)' },
      extra: { text: texto },
    });
    // Archivo previo (MP3 subido a mano) que debe quedar reemplazado y borrado.
    const prev = await http().post(`/api/admin/resources/${r.id}/file`).set('Authorization', `Bearer ${adminToken}`).attach('file', Buffer.concat([FAKE_MP3, Buffer.from('viejo')]), 'viejo.mp3').expect(201);
    const prevSha = prev.body.fileSha256 as string;
    const prevKey = (await prisma.resource.findUniqueOrThrow({ where: { id: r.id } })).filePath as string;
    expect(existsSync(path.join(TEST_STORAGE_DIR, prevKey))).toBe(true);

    const res = await http().post(`/api/admin/resources/${r.id}/narrar`).set('Authorization', `Bearer ${libToken}`).send({}).expect(200);
    expect(res.body).toMatchObject({
      id: r.id, format: 'MP3', hasFile: true, narrator: TTS_VOICE_CREDIT, fileSizeBytes: FAKE_MP3.length,
      license: { rightsHolder: 'Biblioteca Macondo', licenseName: 'Contenido propio; voz sintética Piper es_ES-davefx-medium (datos CC0)' },
    });
    const expectedSeconds = Math.round(texto.replace(/\s+/g, ' ').length * 0.05);
    expect(res.body.durationSeconds).toBe(expectedSeconds);
    expect(res.body.fileSha256).not.toBe(prevSha);

    const row = await prisma.resource.findUniqueOrThrow({ where: { id: r.id } });
    expect(row.fileMime).toBe('audio/mpeg');
    expect(row.filePath).toMatch(/^files\/[a-f0-9-]{36}\.mp3$/);
    expect(row.filePath).not.toBe(prevKey);
    expect(existsSync(path.join(TEST_STORAGE_DIR, prevKey))).toBe(false); // el MP3 anterior se borra
    expect(existsSync(path.join(TEST_STORAGE_DIR, row.filePath!))).toBe(true);
    const audit = await prisma.auditLog.findFirst({ where: { action: 'RESOURCE_NARRATE', entityId: r.id } });
    expect(audit?.details).toMatchObject({ format: 'MP3', durationSeconds: expectedSeconds, textSource: 'extra.text', licenseNameChanged: true, voice: TTS_VOICE_CREDIT });

    // El MP3 generado se sirve con Range (206) al publicarse.
    await http().post(`/api/admin/resources/${r.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'PUBLISHED' }).expect(200);
    const part = await http().get(`/api/resources/${r.id}/file`).set('Range', 'bytes=0-9').buffer().parse(binaryParser).expect(206);
    expect(part.headers['content-range']).toBe(`bytes 0-9/${FAKE_MP3.length}`);
    expect(part.headers['content-type']).toMatch(/audio\/mpeg/);
    expect((part.body as Buffer).equals(FAKE_MP3.subarray(0, 10))).toBe(true);
  });

  it('con «text» en el cuerpo no cambia una licencia que no menciona voz sintética', async () => {
    const r = await createResource({ type: 'AUDIOSUMMARY', license: { ...resourceInput().license as object, licenseName: 'CC BY 4.0' } });
    const res = await http().post(`/api/admin/resources/${r.id}/narrar`).set('Authorization', `Bearer ${adminToken}`).send({ text: 'Un resumen breve.', lengthScale: 1.2, sentenceSilence: 0.5 }).expect(200);
    expect(res.body.license.licenseName).toBe('CC BY 4.0');
    expect(res.body.narrator).toBe(TTS_VOICE_CREDIT);
    const audit = await prisma.auditLog.findFirst({ where: { action: 'RESOURCE_NARRATE', entityId: r.id } });
    expect(audit?.details).toMatchObject({ textSource: 'body', licenseNameChanged: false });
  });
});

describe('sin motor instalado', () => {
  let bare: INestApplication;
  beforeAll(async () => {
    process.env.TTS_PIPER_BIN = path.join(dir, 'no-existe');
    bare = await bootApp();
  });
  afterAll(async () => {
    await bare?.close();
  });
  it('estado ok=false y narrar → 503 «Narración no disponible»', async () => {
    const token = await tokenFor(bare, ADMIN);
    const st = await request(bare.getHttpServer()).get('/api/admin/tts/estado').set('Authorization', `Bearer ${token}`).expect(200);
    expect(st.body).toMatchObject({ enabled: true, ok: false, detail: expect.stringMatching(/binario de Piper/) });
    const r = await request(bare.getHttpServer()).post('/api/admin/resources').set('Authorization', `Bearer ${token}`).send(resourceInput({ type: 'AUDIOSUMMARY', extra: { text: 'Hola.' } })).expect(201);
    const res = await request(bare.getHttpServer()).post(`/api/admin/resources/${r.body.id}/narrar`).set('Authorization', `Bearer ${token}`).send({}).expect(503);
    expect(res.body.message).toMatch(/Narración no disponible/);
  });
});
