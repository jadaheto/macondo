import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { COVER_THUMB_WIDTHS, type CoverThumbWidth } from '@macondo/shared';
import sharp from 'sharp';
import { STORAGE_PROVIDER, type StorageProvider, thumbKeyFor } from '../storage/storage.provider';

/** Calidad WebP de las miniaturas (portadas ilustradas: 80 conserva texto legible con ~2 % del peso del PNG). */
export const THUMB_WEBP_QUALITY = 80;
export const THUMB_MIME = 'image/webp';

/**
 * `?w=` de las rutas de portada: sin valor → original; 240|480 → miniatura; cualquier otro → 400.
 * Acepta el valor crudo de `req.query.w` (string, arreglo o undefined).
 */
export function parseThumbWidth(raw: unknown): CoverThumbWidth | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const n = typeof raw === 'string' && /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : NaN;
  if ((COVER_THUMB_WIDTHS as readonly number[]).includes(n)) return n as CoverThumbWidth;
  throw new BadRequestException(`Ancho de miniatura no permitido. Valores válidos: ${COVER_THUMB_WIDTHS.join(', ')}.`);
}

/**
 * Miniaturas de portada generadas en la PRIMERA petición y guardadas en el almacenamiento bajo
 * `thumbs/<uuid-de-la-portada>-w<ancho>.webp` (misma abstracción que archivos y portadas: ADR-004,
 * así una migración a S3/MinIO también cubre las miniaturas). Al reemplazar una portada su uuid cambia,
 * de modo que las miniaturas viejas quedan huérfanas y `removeFor` las borra.
 */
@Injectable()
export class ThumbnailService {
  private readonly log = new Logger(ThumbnailService.name);
  /** Generaciones en curso por clave: N peticiones simultáneas de la misma miniatura → un solo sharp. */
  private readonly inflight = new Map<string, Promise<string | null>>();

  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  /**
   * Clave de la miniatura, generándola si aún no existe. Devuelve null si la portada no se pudo
   * decodificar (imagen dañada): el llamador sirve entonces la portada original.
   */
  async ensure(coverKey: string, width: CoverThumbWidth): Promise<string | null> {
    const key = thumbKeyFor(coverKey, width);
    if (await this.storage.stat(key)) return key;
    let p = this.inflight.get(key);
    if (!p) {
      p = this.generate(coverKey, key, width).finally(() => this.inflight.delete(key));
      this.inflight.set(key, p);
    }
    return p;
  }

  /** Borra las miniaturas derivadas de una portada (al reemplazarla o quitarla). */
  async removeFor(coverKey: string): Promise<void> {
    for (const w of COVER_THUMB_WIDTHS) {
      try {
        await this.storage.delete(thumbKeyFor(coverKey, w));
      } catch {
        /* clave inválida o ya borrada */
      }
    }
  }

  private async generate(coverKey: string, key: string, width: CoverThumbWidth): Promise<string | null> {
    try {
      const chunks: Buffer[] = [];
      for await (const c of await this.storage.createReadStream(coverKey)) chunks.push(c as Buffer);
      const out = await sharp(Buffer.concat(chunks), { failOn: 'error', animated: false })
        .rotate() // respeta la orientación EXIF de fotos subidas desde el móvil
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: THUMB_WEBP_QUALITY })
        .toBuffer();
      await this.storage.put(key, out);
      return key;
    } catch (err) {
      this.log.warn(`No se pudo generar la miniatura ${key} de ${coverKey}: ${(err as Error).message}`);
      return null;
    }
  }
}
