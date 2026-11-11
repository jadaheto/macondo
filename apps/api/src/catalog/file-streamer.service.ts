import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { STORAGE_PROVIDER, type StorageProvider } from '../storage/storage.provider';
import { parseRange } from './range';

/** `If-None-Match` admite lista separada por comas, prefijo débil `W/` y `*`. */
export function etagMatches(header: string | string[] | undefined, etag: string): boolean {
  if (!header) return false;
  const raw = Array.isArray(header) ? header.join(',') : header;
  return raw.split(',').some((t) => {
    const v = t.trim().replace(/^W\//, '');
    return v === '*' || v === `"${etag}"`;
  });
}

@Injectable()
export class FileStreamerService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  /** Envía un objeto del almacenamiento con soporte de Range (206/416). Devuelve true si se envió desde el byte 0. */
  async send(req: Request, res: Response, opts: { key: string; mime: string; filename: string; etag?: string | null }): Promise<boolean> {
    const stat = await this.storage.stat(opts.key);
    if (!stat) throw new NotFoundException('El archivo no está disponible en el almacenamiento');
    const size = stat.sizeBytes;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', opts.mime);
    res.setHeader('Content-Disposition', `inline; filename="${opts.filename.replace(/[^\w.\-]/g, '_')}"`);
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (opts.etag) res.setHeader('ETag', `"${opts.etag}"`);

    // Revalidación condicional (portadas, imágenes de galería, archivos): si el cliente ya tiene esta
    // versión responde 304 sin cuerpo. La licencia ya se comprobó antes de llegar aquí, así que
    // `must-revalidate` se mantiene. Solo sin Range (las peticiones parciales siguen con 206).
    if (opts.etag && !req.headers.range && etagMatches(req.headers['if-none-match'], opts.etag)) {
      res.status(304);
      res.removeHeader('Content-Type');
      res.end();
      return false;
    }

    const parsed = parseRange(req.headers.range, size);
    if (parsed.kind === 'unsatisfiable') {
      res.status(416).setHeader('Content-Range', `bytes */${size}`);
      res.end();
      return false;
    }
    if (parsed.kind === 'partial') {
      const { start, end } = parsed.range;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      if (req.method === 'HEAD') {
        res.end();
        return start === 0;
      }
      await this.pipe(await this.storage.createReadStream(opts.key, parsed.range), res);
      return start === 0;
    }
    res.status(200);
    res.setHeader('Content-Length', String(size));
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    if (size === 0) {
      res.end();
      return true;
    }
    await this.pipe(await this.storage.createReadStream(opts.key), res);
    return true;
  }

  private async pipe(stream: NodeJS.ReadableStream, res: Response): Promise<void> {
    try {
      await pipeline(stream, res);
    } catch {
      // Cliente cerró la conexión (habitual al buscar en un audio): no es un error del servidor.
      if (!res.headersSent) res.status(500);
      res.destroy();
    }
  }
}
