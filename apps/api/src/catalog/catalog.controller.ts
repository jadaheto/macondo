import { Controller, Get, NotFoundException, Param, Query, Req, Res } from '@nestjs/common';
import { CatalogQuerySchema, type CatalogQuery, type GalleryDTO, type OfflineManifest, type Paginated, type ResourceDTO } from '@macondo/shared';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CatalogService } from './catalog.service';
import { FileStreamerService } from './file-streamer.service';
import { toResourceDTO } from './resource.mapper';
import { parseThumbWidth, THUMB_MIME, ThumbnailService } from './thumbnail.service';

const EXT_BY_FORMAT: Record<string, string> = { EPUB: 'epub', PDF: 'pdf', MP3: 'mp3', IMAGE_SET: 'zip' };

/**
 * Sirve la portada de un recurso, original o miniatura WebP (`?w=240|480`). Compartido por la ruta
 * pública y la vista previa del panel. La clave interna cambia con cada portada subida: sirve de
 * versión para el ETag (permite 304) tanto del original como de cada miniatura.
 */
export async function sendCover(
  deps: { streamer: FileStreamerService; thumbs: ThumbnailService },
  req: Request,
  res: Response,
  r: { id: string; coverPath: string; coverMime: string | null },
): Promise<void> {
  const w = parseThumbWidth(req.query.w);
  const version = createHash('sha256').update(r.coverPath).digest('hex');
  if (w) {
    const key = await deps.thumbs.ensure(r.coverPath, w);
    if (key) {
      await deps.streamer.send(req, res, {
        key, mime: THUMB_MIME, filename: `portada-${r.id}-w${w}.webp`,
        etag: createHash('sha256').update(`${r.coverPath}:w${w}`).digest('hex'),
      });
      return;
    }
    // Portada no decodificable: se sirve el original para no dejar la cuadrícula sin imagen.
  }
  await deps.streamer.send(req, res, { key: r.coverPath, mime: r.coverMime ?? 'application/octet-stream', filename: `portada-${r.id}`, etag: version });
}

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService, private readonly streamer: FileStreamerService, private readonly thumbs: ThumbnailService) {}

  @Get('resources')
  list(@Query(new ZodValidationPipe(CatalogQuerySchema)) q: CatalogQuery): Promise<Paginated<ResourceDTO>> {
    return this.catalog.list(q);
  }

  @Get('resources/:id')
  async get(@Param('id') id: string): Promise<ResourceDTO> {
    return toResourceDTO(await this.catalog.getPublished(id));
  }

  @Get('resources/:id/file')
  async file(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.catalog.getFileForPublic(id);
    const isFirstChunk = !req.headers.range || /^bytes=0-/.test(req.headers.range);
    if (req.method === 'GET' && isFirstChunk) await this.catalog.countFileOpen(r.id).catch(() => undefined);
    await this.streamer.send(req, res, {
      key: r.filePath,
      mime: r.fileMime ?? 'application/octet-stream',
      filename: `recurso-${r.id}.${EXT_BY_FORMAT[r.format] ?? 'bin'}`,
      etag: r.fileSha256,
    });
  }

  @Get('resources/:id/cover')
  async cover(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.catalog.getPublished(id);
    if (!r.coverPath) throw new NotFoundException('Este recurso no tiene portada');
    await sendCover({ streamer: this.streamer, thumbs: this.thumbs }, req, res, { id: r.id, coverPath: r.coverPath, coverMime: r.coverMime });
  }

  @Get('resources/:id/gallery')
  async gallery(@Param('id') id: string): Promise<GalleryDTO> {
    const { resource, gallery } = await this.catalog.getGalleryForPublic(id);
    await this.catalog.countFileOpen(resource.id).catch(() => undefined);
    return this.catalog.toGalleryDTO(resource.id, gallery);
  }

  @Get('resources/:id/gallery/:index')
  async galleryImage(@Param('id') id: string, @Param('index') index: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const { resource, gallery } = await this.catalog.getGalleryForPublic(id);
    const i = /^\d{1,3}$/.test(index) ? Number(index) : -1;
    const item = gallery.items[i];
    if (!item) throw new NotFoundException('Imagen no encontrada');
    await this.streamer.send(req, res, { key: item.key, mime: item.mime, filename: `galeria-${resource.id}-${i}`, etag: item.sha256 });
  }

  @Get('offline/manifest')
  manifest(): Promise<OfflineManifest> {
    return this.catalog.offlineManifest();
  }
}
