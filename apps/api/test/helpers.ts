import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app.factory';

export const ADMIN = { email: 'admin.test@macondo.local', password: 'AdminPrueba2026!' };
export const LIBRARIAN = { email: 'biblio.test@macondo.local', password: 'BiblioPrueba2026!' };

export async function resetDb(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE "AuditLog", "ReadingEvent", "TvSlide", "Challenge", "GeneratedStory", "Resource", "User" CASCADE');
  await prisma.user.createMany({
    data: [
      { email: ADMIN.email, name: 'Admin Prueba', role: 'ADMIN', passwordHash: await bcrypt.hash(ADMIN.password, 4) },
      { email: LIBRARIAN.email, name: 'Biblio Prueba', role: 'LIBRARIAN', passwordHash: await bcrypt.hash(LIBRARIAN.password, 4) },
    ],
  });
}

export async function bootApp(): Promise<INestApplication> {
  return createApp({ logger: false });
}

export async function tokenFor(app: INestApplication, creds: { email: string; password: string }): Promise<string> {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send(creds).expect(200);
  return res.body.accessToken as string;
}

/** Parser binario para supertest. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function binaryParser(res: any, cb: (err: Error | null, body: any) => void): void {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
}

export function resourceInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Cien cuentos de prueba',
    creator: 'Autora de Prueba',
    type: 'BOOK',
    description: 'Un libro de demostración para pruebas automáticas.',
    gradeMin: 4,
    gradeMax: 6,
    categories: ['cuentos'],
    license: {
      rightsHolder: 'Dominio público',
      licenseName: 'Dominio público',
      licenseUrl: null,
      authorizedDevices: 30,
      offlineAllowed: true,
      validFrom: null,
      validUntil: null,
      territory: 'CO',
    },
    ...overrides,
  };
}

// Fixtures binarios mínimos (firmas válidas)
export const PDF_BYTES = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(1000, 0x20), Buffer.from('\n%%EOF\n')]);
export const EPUB_BYTES = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('mimetypeapplication/epub+zip'), Buffer.alloc(500, 1)]);
export const MP3_BYTES = Buffer.concat([Buffer.from('ID3'), Buffer.from(Array.from({ length: 4093 }, (_, i) => i % 256))]);
export const MP3_SYNC_BYTES = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(2000, 7)]);
export const PNG_BYTES = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(200, 3)]);

/** Escritor ZIP mínimo para pruebas (permite fabricar entradas maliciosas). */
import { crc32, deflateRawSync } from 'node:zlib';
export interface ZipSpec { name: string; data: Buffer | string; deflate?: boolean; symlink?: boolean }
export function makeZip(specs: ZipSpec[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const s of specs) {
    const raw = Buffer.isBuffer(s.data) ? s.data : Buffer.from(s.data);
    const comp = s.deflate ? deflateRawSync(raw) : raw;
    const name = Buffer.from(s.name, 'utf8');
    const crc = crc32(raw) >>> 0;
    const method = s.deflate ? 8 : 0;
    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(0x0800, 6); loc.writeUInt16LE(method, 8);
    loc.writeUInt32LE(crc, 14); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(raw.length, 22); loc.writeUInt16LE(name.length, 26);
    locals.push(loc, name, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE((3 << 8) | 20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(method, 10); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(raw.length, 24);
    cen.writeUInt16LE(name.length, 28);
    const mode = s.symlink ? 0o120777 : s.name.endsWith('/') ? 0o040755 : 0o100644;
    cen.writeUInt32LE((mode << 16) >>> 0, 38); cen.writeUInt32LE(offset, 42);
    centrals.push(cen, name);
    offset += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(specs.length, 8); eocd.writeUInt16LE(specs.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

export const galleryJson = (files: string[], extra: Record<string, unknown> = {}) => JSON.stringify({
  slug: 'fauna-prueba',
  title: 'Fauna de prueba',
  description: 'Galería generada en pruebas.',
  items: files.map((file, i) => ({
    file, alt: `Imagen ${i + 1}`, caption: `Pie ${i + 1}`, credit: 'Autora de prueba', license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ejemplo.jpg',
  })),
  activity: { kind: 'trivia', questions: [{ prompt: '¿Cuántas imágenes hay?', options: ['Dos', 'Tres'], answer: 1, explanation: 'Son tres.' }] },
  ...extra,
});
export const pngN = (n: number) => Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(300 + n, n)]);
