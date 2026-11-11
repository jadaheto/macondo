/**
 * Semilla idempotente de Macondo Digital (solo desarrollo/demostración).
 *   npm run seed -w @macondo/api
 * - Admin desde SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD y una bibliotecaria demo (contraseña solo se fija al crear).
 * - Si existe demo-content/manifest.json importa sus recursos (upsert por título+tipo) copiando archivos al almacenamiento.
 * - Si no existe, crea marcadores de posición en BORRADOR. Volver a ejecutar recoge el manifest cuando aparezca.
 */
import { LicenseSchema, RESOURCE_TYPE_LABELS, ResourceTypeSchema, ResourceStatusSchema, type FileFormat } from '@macondo/shared';
import { PrismaClient, type Resource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, promises as fs, realpathSync } from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { validateUpload } from '../src/common/upload-validation';
import { readConfig, REPO_ROOT } from '../src/config/env';
import { LocalStorageProvider } from '../src/storage/local-storage.provider';

const PLACEHOLDER_PREFIX = 'Marcador de posición';
const DEMO_DIR = path.resolve(process.env.DEMO_CONTENT_DIR ?? path.join(REPO_ROOT, 'demo-content'));
const MANIFEST = path.join(DEMO_DIR, 'manifest.json');

const ManifestItemSchema = z.object({
  file: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  title: z.string().min(1).max(300),
  creator: z.string().min(1).max(200),
  type: ResourceTypeSchema,
  description: z.string().max(5000).default(''),
  gradeMin: z.number().int().min(1).max(11),
  gradeMax: z.number().int().min(1).max(11),
  categories: z.array(z.string().min(1).max(60)).default([]),
  language: z.string().max(10).optional(),
  narrator: z.string().nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  status: ResourceStatusSchema.optional(),
  license: LicenseSchema,
});
type ManifestItem = z.infer<typeof ManifestItemSchema>;

const prisma = new PrismaClient();
const cfg = readConfig();
const storage = new LocalStorageProvider(cfg.storageDir);

/** Ruta dentro de demo-content, rechazando traversal. */
function demoPath(rel: string): string | null {
  const full = path.resolve(DEMO_DIR, rel);
  if (!full.startsWith(DEMO_DIR + path.sep) || !existsSync(full)) return null;
  // También se resuelven enlaces simbólicos para no salir de demo-content.
  const real = realpathSync(full);
  return real.startsWith(realpathSync(DEMO_DIR) + path.sep) ? real : null;
}

async function sha256File(file: string): Promise<string> {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(file)) h.update(chunk as Buffer);
  return h.digest('hex');
}

async function head(file: string): Promise<Buffer> {
  const fh = await fs.open(file, 'r');
  try {
    const b = Buffer.alloc(16);
    const { bytesRead } = await fh.read(b, 0, 16, 0);
    return b.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

async function seedUsers(): Promise<void> {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@macondo.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) throw new Error('SEED_ADMIN_PASSWORD debe tener al menos 8 caracteres');
  const users = [
    { email: adminEmail, name: 'Administración Macondo', role: 'ADMIN' as const, password: adminPassword },
    {
      email: (process.env.SEED_LIBRARIAN_EMAIL ?? 'bibliotecaria@macondo.local').toLowerCase(),
      name: 'Bibliotecaria Demo',
      role: 'LIBRARIAN' as const,
      password: process.env.SEED_LIBRARIAN_PASSWORD ?? 'BibliotecaDemo2026!',
    },
  ];
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: u.role, active: true } });
      console.log(`  usuario existente: ${u.email} (${u.role})`);
    } else {
      await prisma.user.create({ data: { email: u.email, name: u.name, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) } });
      console.log(`  usuario creado: ${u.email} (${u.role})`);
    }
  }
}

async function attach(existing: Resource | null, kind: 'file' | 'cover', rel: string | null | undefined) {
  if (!rel) return {};
  const full = demoPath(rel);
  if (!full) {
    console.warn(`  ! ${kind} no encontrado o fuera de demo-content: ${rel}`);
    return {};
  }
  const detected = validateUpload(kind, full, await head(full));
  const sha = await sha256File(full);
  if (kind === 'file') {
    if (existing?.filePath && existing.fileSha256 === sha && (await storage.stat(existing.filePath))) return {};
    const saved = await storage.save('files', detected.ext, createReadStream(full));
    if (existing?.filePath) await storage.delete(existing.filePath);
    return { filePath: saved.key, fileMime: detected.mime, fileSha256: saved.sha256, fileSizeBytes: saved.sizeBytes, format: detected.format as FileFormat };
  }
  // Portada: se compara por hash del contenido actual en almacenamiento.
  if (existing?.coverPath && (await storage.stat(existing.coverPath))) {
    const h = createHash('sha256');
    for await (const c of await storage.createReadStream(existing.coverPath)) h.update(c as Buffer);
    if (h.digest('hex') === sha) return {};
  }
  const saved = await storage.save('covers', detected.ext, createReadStream(full));
  if (existing?.coverPath) await storage.delete(existing.coverPath);
  return { coverPath: saved.key, coverMime: detected.mime };
}

async function importManifest(items: ManifestItem[]): Promise<void> {
  for (const item of items) {
    if (item.gradeMin > item.gradeMax) {
      console.warn(`  ! omitido (gradeMin > gradeMax): ${item.title}`);
      continue;
    }
    for (const [kind, rel] of [['file', item.file], ['cover', item.cover]] as const) {
      if (rel && !demoPath(rel)) {
        console.warn(`  ! omitido "${item.title}": ${kind} no encontrado o fuera de demo-content (${rel})`);
      }
    }
    if ((item.file && !demoPath(item.file)) || (item.cover && !demoPath(item.cover))) continue;
    const existing = await prisma.resource.findFirst({ where: { title: item.title, type: item.type } });
    try {
      const fileCols = await attach(existing, 'file', item.file);
      const coverCols = await attach(existing, 'cover', item.cover);
      const l = item.license;
      const data = {
        title: item.title,
        creator: item.creator,
        type: item.type,
        description: item.description,
        gradeMin: item.gradeMin,
        gradeMax: item.gradeMax,
        categories: item.categories,
        language: item.language ?? 'es',
        narrator: item.narrator ?? null,
        durationSeconds: item.durationSeconds ?? null,
        status: item.status ?? 'PUBLISHED',
        licenseRightsHolder: l.rightsHolder,
        licenseName: l.licenseName,
        licenseUrl: l.licenseUrl ?? null,
        licenseAuthorizedDevices: l.authorizedDevices,
        licenseOfflineAllowed: l.offlineAllowed,
        licenseValidFrom: l.validFrom ? new Date(l.validFrom) : null,
        licenseValidUntil: l.validUntil ? new Date(l.validUntil) : null,
        licenseTerritory: l.territory,
        ...fileCols,
        ...coverCols,
      };
      if (existing) {
        // Nunca sobrescribir un recurso existente: el estado (publicado/retirado) y los metadatos
        // pertenecen a las decisiones tomadas en /admin. El seed corre en cada arranque del
        // contenedor (SEED_ON_START), así que solo adjunta archivos que falten.
        const missing = { ...(existing.filePath ? {} : fileCols), ...(existing.coverPath ? {} : coverCols) };
        if (Object.keys(missing).length) {
          await prisma.resource.update({ where: { id: existing.id }, data: missing });
          console.log(`  archivos completados: [${item.type}] ${item.title}`);
        } else {
          console.log(`  sin cambios (ya existe): [${item.type}] ${item.title}`);
        }
      } else {
        await prisma.resource.create({ data });
        console.log(`  creado: [${item.type}] ${item.title}`);
      }
    } catch (e) {
      console.warn(`  ! error importando "${item.title}": ${(e as Error).message}`);
    }
  }
  // Los marcadores ya no hacen falta: se retiran (nunca se borran).
  const retired = await prisma.resource.updateMany({
    where: { title: { startsWith: PLACEHOLDER_PREFIX }, status: { not: 'RETIRED' } },
    data: { status: 'RETIRED' },
  });
  if (retired.count) console.log(`  marcadores de posición retirados: ${retired.count}`);
}

async function seedPlaceholders(): Promise<void> {
  const placeholders = [
    { type: 'BOOK' as const, gradeMin: 1, gradeMax: 3, n: 1 },
    { type: 'AUDIOBOOK' as const, gradeMin: 4, gradeMax: 5, n: 1 },
    { type: 'AUDIOBIOGRAPHY' as const, gradeMin: 6, gradeMax: 8, n: 1 },
    { type: 'AUDIOSUMMARY' as const, gradeMin: 9, gradeMax: 11, n: 1 },
    { type: 'GALLERY' as const, gradeMin: 1, gradeMax: 11, n: 1 },
  ];
  for (const p of placeholders) {
    const title = `${PLACEHOLDER_PREFIX} — ${RESOURCE_TYPE_LABELS[p.type]} ${p.n}`;
    const exists = await prisma.resource.findFirst({ where: { title: { startsWith: PLACEHOLDER_PREFIX }, type: p.type } });
    if (exists) {
      if (exists.title !== title) await prisma.resource.update({ where: { id: exists.id }, data: { title } });
      continue;
    }
    await prisma.resource.create({
      data: {
        title,
        creator: 'Pendiente de adquisición',
        type: p.type,
        description: 'Marcador de posición sin archivo. Reemplazar por un recurso con licencia verificada.',
        gradeMin: p.gradeMin,
        gradeMax: p.gradeMax,
        categories: ['marcador'],
        status: 'DRAFT',
        format: 'NONE',
        licenseRightsHolder: 'Pendiente',
        licenseName: 'Sin licencia (marcador de posición)',
        licenseAuthorizedDevices: 0,
        licenseOfflineAllowed: false,
      },
    });
    console.log(`  marcador creado: ${title}`);
  }
}

async function seedTvSlides(): Promise<void> {
  const book = await prisma.resource.findFirst({ where: { status: 'PUBLISHED', type: 'BOOK' }, orderBy: { title: 'asc' } });
  const slides = [
    { kind: 'MESSAGE' as const, title: 'Bienvenidos a la Biblioteca Macondo', body: 'Explora libros, audiolibros y galerías en las tablets y el kiosco.', order: 0 },
    { kind: 'FUN_FACT' as const, title: '¿Sabías que…?', body: 'Leer 20 minutos al día amplía tu vocabulario en miles de palabras al año.', order: 1 },
    { kind: 'CHALLENGE' as const, title: 'Reto lector del mes', body: 'Lee un cuento y cuéntaselo a un compañero con tus propias palabras.', order: 2 },
    ...(book
      ? [{ kind: 'BOOK_OF_WEEK' as const, title: 'Libro de la semana', body: `${book.title} — ${book.creator}`, order: 3, resourceId: book.id }]
      : []),
  ];
  for (const s of slides) {
    const exists = await prisma.tvSlide.findFirst({ where: { title: s.title, kind: s.kind } });
    if (exists) continue;
    await prisma.tvSlide.create({ data: { ...s, durationSeconds: 15, active: true } });
    console.log(`  diapositiva TV creada: ${s.title}`);
  }
}

async function main(): Promise<void> {
  console.log('Semilla Macondo Digital');
  await seedUsers();
  if (existsSync(MANIFEST)) {
    console.log(`Importando ${MANIFEST}`);
    const raw = JSON.parse(await fs.readFile(MANIFEST, 'utf8')) as unknown;
    if (!Array.isArray(raw)) throw new Error('manifest.json debe ser un arreglo');
    const items: ManifestItem[] = [];
    raw.forEach((it, i) => {
      const r = ManifestItemSchema.safeParse(it);
      if (r.success) items.push(r.data);
      else console.warn(`  ! entrada ${i} inválida: ${r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`);
    });
    await importManifest(items);
  } else {
    console.log('No hay demo-content/manifest.json: se crean marcadores de posición (BORRADOR).');
    await seedPlaceholders();
  }
  await seedTvSlides();
  const [resources, published] = await Promise.all([prisma.resource.count(), prisma.resource.count({ where: { status: 'PUBLISHED' } })]);
  console.log(`Listo. Recursos: ${resources} (publicados: ${published}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
