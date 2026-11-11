import { ALLOWED_UPLOADS, type FileFormat } from '@macondo/shared';
import * as path from 'node:path';

export type UploadKind = 'file' | 'cover';

export interface DetectedUpload {
  ext: string;
  format: FileFormat | 'IMAGE';
  mime: string;
}

/** Portadas: extensiones permitidas y su firma (magic bytes). */
const IMAGE_UPLOADS: Record<string, { mime: string; check: (b: Buffer) => boolean }> = {
  png: { mime: 'image/png', check: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) },
  jpg: { mime: 'image/jpeg', check: isJpeg },
  jpeg: { mime: 'image/jpeg', check: isJpeg },
  webp: {
    mime: 'image/webp',
    check: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
};

/** Detecta una imagen JPG/PNG/WebP por extensión + firma. Devuelve null si no coincide. */
export function detectImage(ext: string, head: Buffer): { ext: string; mime: string } | null {
  const rule = IMAGE_UPLOADS[ext.toLowerCase()];
  if (!rule || !rule.check(head)) return null;
  return { ext: ext.toLowerCase() === 'jpeg' ? 'jpg' : ext.toLowerCase(), mime: rule.mime };
}

function isJpeg(b: Buffer): boolean {
  return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

export function isMp3(b: Buffer): boolean {
  if (b.length >= 3 && b.toString('latin1', 0, 3) === 'ID3') return true;
  // Frame sync MPEG: 11 bits a 1 (0xFF y máscara 0xE0 en el segundo byte)
  return b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0;
}

/** Extensión en minúsculas, sin punto. Solo se usa para clasificar: el nombre del cliente nunca se guarda. */
export function safeExtension(originalName: string | undefined): string {
  const base = path.basename(String(originalName ?? '').replace(/\\/g, '/'));
  return path.extname(base).slice(1).toLowerCase();
}

export class UploadValidationError extends Error {}

/**
 * Valida extensión (lista blanca) Y firma binaria. Lanza UploadValidationError con mensaje en español.
 * `head` debe contener al menos los primeros 16 bytes del archivo.
 */
export function validateUpload(kind: UploadKind, originalName: string | undefined, head: Buffer): DetectedUpload {
  const ext = safeExtension(originalName);
  if (kind === 'cover') {
    const rule = IMAGE_UPLOADS[ext];
    if (!rule) throw new UploadValidationError(`Extensión no permitida para portada (.${ext || '?'}). Use PNG, JPG o WEBP.`);
    if (!rule.check(head)) throw new UploadValidationError('El contenido de la imagen no coincide con su extensión.');
    return { ext: ext === 'jpeg' ? 'jpg' : ext, format: 'IMAGE', mime: rule.mime };
  }
  const rule = ALLOWED_UPLOADS[ext];
  if (!rule) {
    const allowed = Object.keys(ALLOWED_UPLOADS).map((e) => e.toUpperCase()).join(', ');
    throw new UploadValidationError(`Extensión no permitida (.${ext || '?'}). Formatos admitidos: ${allowed}.`);
  }
  const ok = rule.format === 'MP3'
    ? isMp3(head)
    : rule.magic
      ? head.length >= rule.magic.length / 2 && head.subarray(0, rule.magic.length / 2).toString('hex') === rule.magic.toLowerCase()
      : false;
  if (!ok) throw new UploadValidationError('El contenido del archivo no coincide con su extensión (firma inválida o archivo dañado).');
  return { ext, format: rule.format, mime: rule.mime[0] };
}
