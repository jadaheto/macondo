import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  API_ROUTES,
  canDownloadOffline,
  COVER_GRID_WIDTH,
  type CatalogQuery,
  type GalleryDTO,
  isLicenseActive,
  type OfflineManifest,
  type OfflineManifestEntry,
  type Paginated,
  type ResourceDTO,
} from '@macondo/shared';
import { Prisma, type Resource } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { type StoredGallery, storedGalleryOf } from './gallery.types';
import { licenseOf, toResourceDTO } from './resource.mapper';

export const LICENSE_INACTIVE_MESSAGE =
  'La licencia de este recurso no está vigente. No es posible abrirlo ni descargarlo en este momento.';

export function buildResourceWhere(q: Partial<CatalogQuery>): Prisma.ResourceWhereInput {
  const where: Prisma.ResourceWhereInput = {};
  const and: Prisma.ResourceWhereInput[] = [];
  const text = q.q?.trim();
  if (text) {
    and.push({
      OR: [
        { title: { contains: text, mode: 'insensitive' } },
        { creator: { contains: text, mode: 'insensitive' } },
        { description: { contains: text, mode: 'insensitive' } },
      ],
    });
  }
  if (q.type) where.type = q.type;
  if (q.grade) and.push({ gradeMin: { lte: q.grade } }, { gradeMax: { gte: q.grade } });
  if (q.category) where.categories = { has: q.category };
  if (and.length) where.AND = and;
  return where;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: CatalogQuery): Promise<Paginated<ResourceDTO>> {
    const where: Prisma.ResourceWhereInput = { ...buildResourceWhere(q), status: 'PUBLISHED' };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    const now = new Date();
    return { items: rows.map((r) => toResourceDTO(r, now)), total, page: q.page, pageSize: q.pageSize };
  }

  /** Solo recursos publicados son visibles públicamente. */
  async getPublished(id: string): Promise<Resource> {
    const r = id.length <= 64 ? await this.prisma.resource.findUnique({ where: { id } }) : null;
    if (!r || r.status !== 'PUBLISHED') throw new NotFoundException('Recurso no encontrado');
    return r;
  }

  /** Recurso publicado, con archivo y licencia vigente; si no, 404/403 con mensaje en español. */
  async getFileForPublic(id: string): Promise<Resource & { filePath: string }> {
    const r = await this.getPublished(id);
    if (!isLicenseActive(licenseOf(r))) throw new ForbiddenException(LICENSE_INACTIVE_MESSAGE);
    if (!r.filePath) throw new NotFoundException('Este recurso no tiene archivo disponible');
    return r as Resource & { filePath: string };
  }

  /** Galería de un recurso publicado con licencia vigente (403 si no). */
  async getGalleryForPublic(id: string): Promise<{ resource: Resource; gallery: StoredGallery }> {
    const r = await this.getFileForPublic(id);
    const gallery = r.format === 'IMAGE_SET' ? storedGalleryOf(r.gallery) : null;
    if (!gallery) throw new NotFoundException('Este recurso no tiene una galería cargada');
    return { resource: r, gallery };
  }

  toGalleryDTO(id: string, g: StoredGallery): GalleryDTO {
    return {
      title: g.title,
      description: g.description,
      items: g.items.map((it, i) => ({
        url: API_ROUTES.resourceGalleryImage(id, i),
        alt: it.alt, caption: it.caption, credit: it.credit, license: it.license,
        licenseUrl: it.licenseUrl ?? null, sourceUrl: it.sourceUrl ?? null,
        mime: it.mime, sha256: it.sha256, sizeBytes: it.sizeBytes,
      })),
      activity: g.activity ?? null,
    };
  }

  async countFileOpen(resourceId: string): Promise<void> {
    const now = new Date();
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    await this.prisma.readingEvent.upsert({
      where: { resourceId_day_kind: { resourceId, day, kind: 'FILE_OPEN' } },
      create: { resourceId, day, kind: 'FILE_OPEN', count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  async offlineManifest(): Promise<OfflineManifest> {
    const now = new Date();
    const rows = await this.prisma.resource.findMany({
      where: { status: 'PUBLISHED', filePath: { not: null }, fileSha256: { not: null }, licenseOfflineAllowed: true },
      orderBy: { id: 'asc' },
    });
    const entries: OfflineManifestEntry[] = rows
      .filter((r) => canDownloadOffline({ status: r.status, hasFile: !!r.filePath, license: licenseOf(r) }, now))
      .map((r): OfflineManifestEntry => ({
        ...this.galleryAssets(r),
        id: r.id,
        title: r.title,
        type: r.type,
        format: r.format,
        sha256: r.fileSha256 as string,
        sizeBytes: r.fileSizeBytes ?? 0,
        version: r.updatedAt.toISOString(),
        fileUrl: API_ROUTES.resourceFile(r.id),
        // Miniatura pequeña: la copia offline muestra la portada en listas, no a tamaño completo.
        coverUrl: r.coverPath ? API_ROUTES.resourceCover(r.id, COVER_GRID_WIDTH) : null,
        licenseValidUntil: r.licenseValidUntil ? r.licenseValidUntil.toISOString() : null,
      }));
    // La versión cambia si se añade, quita o modifica cualquier entrada.
    const version = createHash('sha256')
      .update(entries.map((e) => `${e.id}@${e.version}@${e.sha256}`).join('\n'))
      .digest('hex')
      .slice(0, 16);
    return { generatedAt: now.toISOString(), version, entries };
  }

  /** IMAGE_SET: el cliente descarga las imágenes individuales (no el ZIP), cada una verificada por sha256. */
  private galleryAssets(r: Resource): Pick<OfflineManifestEntry, 'assets' | 'galleryUrl'> {
    if (r.format !== 'IMAGE_SET') return {};
    const g = storedGalleryOf(r.gallery);
    if (!g) return {};
    return {
      galleryUrl: API_ROUTES.resourceGallery(r.id),
      assets: g.items.map((it, i) => ({ url: API_ROUTES.resourceGalleryImage(r.id, i), sha256: it.sha256, sizeBytes: it.sizeBytes, mime: it.mime })),
    };
  }
}
