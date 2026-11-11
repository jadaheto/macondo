import { GALLERY_LIMITS, type GalleryManifest, GalleryManifestSchema } from '@macondo/shared';
import { promises as fs } from 'node:fs';
import { detectImage } from './upload-validation';
import { readZipDirectory, readZipEntry, ZipError, type ZipEntry } from './zip-reader';

/** 'format' → 415 (no es un ZIP/imagen válida); 'invalid' → 400 (estructura o gallery.json incorrectos). */
export class GalleryZipError extends Error {
  constructor(readonly kind: 'format' | 'invalid', message: string) {
    super(message);
  }
}

export interface ExtractedImage {
  item: GalleryManifest['items'][number];
  data: Buffer;
  ext: string;
  mime: string;
}
export interface ExtractedGallery {
  manifest: GalleryManifest;
  images: ExtractedImage[];
}

const MAX_JSON_BYTES = 1024 * 1024;

/** Basura que añaden Finder/Windows: se ignora (tras pasar los controles de seguridad). */
function isJunk(name: string): boolean {
  const base = name.split('/').filter(Boolean).pop() ?? '';
  return name.startsWith('__MACOSX/') || base === '.DS_Store' || base === 'Thumbs.db' || base.startsWith('._');
}

/** Rechaza rutas absolutas, `..`, barras invertidas, unidades de Windows y caracteres de control. */
export function unsafeEntryName(name: string): string | null {
  if (!name || name.length > 255) return 'nombre vacío o demasiado largo';
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\\]/.test(name)) return 'caracteres no permitidos';
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return 'ruta absoluta';
  const segs = name.split('/');
  if (segs.some((s, i) => s === '..' || s === '.' || (s === '' && i !== segs.length - 1))) return 'ruta relativa peligrosa';
  return null;
}

/**
 * Valida y extrae en memoria una galería ZIP: estructura segura, gallery.json (zod, FORMATO.md) y
 * firma real de cada imagen referenciada. No escribe nada en disco.
 */
export async function extractGalleryZip(zipPath: string, fileSize: number): Promise<ExtractedGallery> {
  const fh = await fs.open(zipPath, 'r');
  try {
    let entries: ZipEntry[];
    try {
      entries = await readZipDirectory(fh, fileSize);
    } catch (e) {
      throw new GalleryZipError('format', e instanceof ZipError ? e.message : 'El ZIP no se pudo leer.');
    }
    if (entries.length === 0) throw new GalleryZipError('invalid', 'El ZIP está vacío.');
    if (entries.length > GALLERY_LIMITS.maxEntries) {
      throw new GalleryZipError('invalid', `El ZIP tiene ${entries.length} entradas; el máximo es ${GALLERY_LIMITS.maxEntries}.`);
    }

    let totalUncompressed = 0;
    const files = new Map<string, ZipEntry>();
    for (const e of entries) {
      const bad = unsafeEntryName(e.name);
      if (bad) throw new GalleryZipError('invalid', `Entrada rechazada «${e.name.slice(0, 80)}»: ${bad}.`);
      if (e.isSymlink) throw new GalleryZipError('invalid', `Entrada rechazada «${e.name}»: los enlaces simbólicos no están permitidos.`);
      if (e.encrypted) throw new GalleryZipError('invalid', `Entrada rechazada «${e.name}»: archivo cifrado.`);
      totalUncompressed += e.uncompressedSize;
      if (totalUncompressed > GALLERY_LIMITS.maxUncompressedBytes) {
        throw new GalleryZipError('invalid', `El contenido descomprimido supera ${GALLERY_LIMITS.maxUncompressedBytes / 1048576} MB.`);
      }
      if (e.uncompressedSize > 0 && e.compressedSize === 0) throw new GalleryZipError('invalid', `«${e.name}»: tamaño comprimido inválido.`);
      if (e.uncompressedSize > 1024 * 1024 && e.uncompressedSize / e.compressedSize > GALLERY_LIMITS.maxCompressionRatio) {
        throw new GalleryZipError('invalid', `«${e.name}»: proporción de compresión sospechosa (posible bomba ZIP).`);
      }
      if (isJunk(e.name)) continue;
      const segs = e.name.split('/').filter(Boolean);
      const depth = e.isDirectory ? segs.length : segs.length - 1;
      if (depth > 1) throw new GalleryZipError('invalid', `«${e.name}»: solo se admite una carpeta (sin subcarpetas).`);
      if (e.isDirectory) continue;
      if (files.has(e.name)) throw new GalleryZipError('invalid', `Entrada duplicada: «${e.name}».`);
      files.set(e.name, e);
    }

    const jsonEntries = [...files.values()].filter((e) => e.name.split('/').pop() === 'gallery.json');
    if (jsonEntries.length === 0) throw new GalleryZipError('invalid', 'Falta gallery.json en el ZIP.');
    if (jsonEntries.length > 1) throw new GalleryZipError('invalid', 'Hay más de un gallery.json en el ZIP.');
    const jsonEntry = jsonEntries[0]!;
    if (jsonEntry.uncompressedSize > MAX_JSON_BYTES) throw new GalleryZipError('invalid', 'gallery.json es demasiado grande.');
    const prefix = jsonEntry.name.slice(0, jsonEntry.name.length - 'gallery.json'.length);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse((await readZipEntry(fh, fileSize, jsonEntry)).toString('utf8').replace(/^﻿/, ''));
    } catch (e) {
      throw new GalleryZipError('invalid', e instanceof ZipError ? e.message : 'gallery.json no es un JSON válido.');
    }
    const parsed = GalleryManifestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`).join('; ');
      throw new GalleryZipError('invalid', `gallery.json no cumple el formato: ${issues}`);
    }
    const manifest = parsed.data;

    const seen = new Set<string>();
    const images: ExtractedImage[] = [];
    for (const item of manifest.items) {
      if (seen.has(item.file)) throw new GalleryZipError('invalid', `La imagen «${item.file}» aparece dos veces en gallery.json.`);
      seen.add(item.file);
      const entry = files.get(prefix + item.file);
      if (!entry) throw new GalleryZipError('invalid', `gallery.json referencia «${item.file}», que no está en el ZIP.`);
      let data: Buffer;
      try {
        data = await readZipEntry(fh, fileSize, entry);
      } catch (e) {
        throw new GalleryZipError('format', e instanceof ZipError ? e.message : `«${item.file}» no se pudo leer.`);
      }
      const ext = item.file.split('.').pop()!.toLowerCase();
      const img = detectImage(ext, data);
      if (!img) throw new GalleryZipError('format', `«${item.file}» no es una imagen ${ext.toUpperCase()} válida (firma incorrecta).`);
      images.push({ item, data, ext: img.ext, mime: img.mime });
    }
    return { manifest, images };
  } finally {
    await fh.close();
  }
}
