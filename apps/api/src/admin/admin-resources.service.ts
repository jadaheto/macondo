import { BadRequestException, Inject, Injectable, NotFoundException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { type NarrateInput, type Paginated, type ResourceDTO, type ResourceExtra, type ResourceInput, ResourceInputSchema, type ResourceStatus, TTS_VOICE_CREDIT } from '@macondo/shared';
import { Prisma, type Resource } from '@prisma/client';
import { createReadStream, promises as fs } from 'node:fs';
import { AuditService } from '../audit/audit.service';
import { buildResourceWhere } from '../catalog/catalog.service';
import { extraOf, licenseOf, licenseToColumns, toResourceDTO } from '../catalog/resource.mapper';
import { extractGalleryZip, GalleryZipError } from '../common/gallery-zip';
import { type StoredGallery, storedGalleryOf } from '../catalog/gallery.types';
import { ThumbnailService } from '../catalog/thumbnail.service';
import { type UploadKind, UploadValidationError, validateUpload } from '../common/upload-validation';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../storage/storage.provider';
import { updateLicenseVoiceCredit } from '../tts/tts-text';
import { TtsService } from '../tts/tts.service';
import type { AdminResourceQuery, ResourcePatch } from './admin-schemas';

function extraJson(extra: ResourceExtra | null | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return extra ? (JSON.parse(JSON.stringify(extra)) as Prisma.InputJsonValue) : Prisma.DbNull;
}

async function readHead(filePath: string, bytes = 16): Promise<Buffer> {
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await fh.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

@Injectable()
export class AdminResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly thumbs: ThumbnailService,
    private readonly tts: TtsService,
  ) {}

  async list(q: AdminResourceQuery): Promise<Paginated<ResourceDTO>> {
    const where = { ...buildResourceWhere(q), ...(q.status && { status: q.status }) };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({ where, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    return { items: rows.map((r) => toResourceDTO(r)), total, page: q.page, pageSize: q.pageSize };
  }

  async find(id: string): Promise<Resource> {
    const r = id.length <= 64 ? await this.prisma.resource.findUnique({ where: { id } }) : null;
    if (!r) throw new NotFoundException('Recurso no encontrado');
    return r;
  }

  async create(input: ResourceInput, actorId: string): Promise<ResourceDTO> {
    const { license, extra, ...rest } = input;
    const lic = licenseToColumns(license);
    const r = await this.prisma.resource.create({
      data: {
        ...rest,
        extra: extraJson(extra),
        narrator: rest.narrator ?? null,
        durationSeconds: rest.durationSeconds ?? null,
        status: 'DRAFT',
        format: 'NONE',
        ...lic,
        licenseRightsHolder: license.rightsHolder,
        licenseName: license.licenseName,
      },
    });
    await this.audit.log(actorId, 'RESOURCE_CREATE', 'Resource', r.id, { title: r.title, type: r.type });
    return toResourceDTO(r);
  }

  async update(id: string, patch: ResourcePatch, actorId: string): Promise<ResourceDTO> {
    const current = await this.find(id);
    const currentDto = toResourceDTO(current);
    // Valida el resultado combinado con el esquema completo del contrato (incluye gradeMin <= gradeMax).
    const merged = ResourceInputSchema.safeParse({
      title: patch.title ?? current.title,
      creator: patch.creator ?? current.creator,
      type: patch.type ?? current.type,
      description: patch.description ?? current.description,
      gradeMin: patch.gradeMin ?? current.gradeMin,
      gradeMax: patch.gradeMax ?? current.gradeMax,
      categories: patch.categories ?? current.categories,
      language: patch.language ?? current.language,
      narrator: patch.narrator !== undefined ? patch.narrator : current.narrator,
      durationSeconds: patch.durationSeconds !== undefined ? patch.durationSeconds : current.durationSeconds,
      license: { ...licenseOf(current), ...(patch.license ?? {}) },
      extra: patch.extra !== undefined ? patch.extra : extraOf(current.extra),
    });
    if (!merged.success) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Datos inválidos',
        issues: merged.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const { license, extra, ...rest } = merged.data;
    const r = await this.prisma.resource.update({
      where: { id },
      data: { ...rest, extra: extraJson(extra), narrator: rest.narrator ?? null, durationSeconds: rest.durationSeconds ?? null, ...licenseToColumns(license) },
    });
    const changed = Object.keys(patch);
    await this.audit.log(actorId, 'RESOURCE_UPDATE', 'Resource', id, { changed, before: pick(currentDto, changed) });
    return toResourceDTO(r);
  }

  async setStatus(id: string, status: ResourceStatus, actorId: string, action = 'RESOURCE_STATUS'): Promise<ResourceDTO> {
    const current = await this.find(id);
    const r = await this.prisma.resource.update({ where: { id }, data: { status } });
    await this.audit.log(actorId, action, 'Resource', id, { from: current.status, to: status });
    return toResourceDTO(r);
  }

  /** Guarda un archivo subido (ya en disco temporal por multer) tras validar extensión y firma. */
  async attachUpload(id: string, kind: UploadKind, file: Express.Multer.File | undefined, actorId: string): Promise<ResourceDTO> {
    if (!file) throw new BadRequestException("Debe adjuntar un archivo en el campo 'file'");
    try {
      const current = await this.find(id);
      if (file.size === 0) throw new BadRequestException('El archivo está vacío');
      if (kind === 'cover' && file.size > this.cfg.maxCoverBytes) {
        throw new PayloadTooLargeException(`La portada supera el máximo de ${Math.round(this.cfg.maxCoverBytes / 1048576)} MB`);
      }
      const head = await readHead(file.path);
      let detected;
      try {
        detected = validateUpload(kind, file.originalname, head);
      } catch (e) {
        if (e instanceof UploadValidationError) throw new UnsupportedMediaTypeException(e.message);
        throw e;
      }
      if (kind === 'file') {
        if (detected.format === 'IMAGE_SET' && current.type !== 'GALLERY') {
          throw new UnsupportedMediaTypeException('Los archivos ZIP solo se admiten en recursos de tipo Galería.');
        }
        if (current.type === 'GALLERY' && detected.format !== 'IMAGE_SET') {
          throw new UnsupportedMediaTypeException('Las galerías se suben como ZIP (imágenes + gallery.json).');
        }
        if (detected.format === 'IMAGE_SET') return await this.attachGallery(current, file, actorId);
      }
      const saved = await this.storage.save(kind === 'file' ? 'files' : 'covers', detected.ext, createReadStream(file.path));
      const data = kind === 'file'
        ? { filePath: saved.key, fileMime: detected.mime, fileSha256: saved.sha256, fileSizeBytes: saved.sizeBytes, format: detected.format as Resource['format'] }
        : { coverPath: saved.key, coverMime: detected.mime };
      const r = await this.prisma.resource.update({ where: { id }, data });
      const oldKey = kind === 'file' ? current.filePath : current.coverPath;
      if (oldKey && oldKey !== saved.key) {
        await this.storage.delete(oldKey).catch(() => undefined);
        // Las miniaturas derivadas de la portada anterior quedan huérfanas: se eliminan.
        if (kind === 'cover') await this.thumbs.removeFor(oldKey);
      }
      await this.audit.log(actorId, kind === 'file' ? 'RESOURCE_FILE_UPLOAD' : 'RESOURCE_COVER_UPLOAD', 'Resource', id, {
        key: saved.key,
        sha256: saved.sha256,
        sizeBytes: saved.sizeBytes,
        format: detected.format,
      });
      return toResourceDTO(r);
    } finally {
      await fs.rm(file.path, { force: true }).catch(() => undefined);
    }
  }

  /**
   * Regraba el recurso con la voz de la biblioteca (ADR-017): sintetiza `body.text` o `extra.text`, guarda el
   * MP3 por el mismo camino que una subida (clave nueva, sha256, tamaño, formato MP3, duración), fija `narrator`
   * al crédito de la voz y actualiza `licenseName` solo si ya mencionaba una voz sintética. El titular no cambia.
   */
  async narrate(id: string, body: NarrateInput, actorId: string): Promise<ResourceDTO> {
    const current = await this.find(id);
    if (current.type === 'GALLERY') throw new BadRequestException('Las galerías no se narran.');
    if (current.filePath && current.format !== 'MP3' && current.format !== 'NONE') {
      throw new BadRequestException(`Este recurso tiene un archivo ${current.format}; la narración solo reemplaza audio. Quita o cambia el tipo del recurso antes.`);
    }
    const text = (body.text ?? extraOf(current.extra)?.text ?? '').trim();
    if (!text) throw new BadRequestException('El recurso no tiene texto para narrar (campo extra.text) y no se envió «text».');
    const result = await this.tts.synthesize(text, { lengthScale: body.lengthScale, sentenceSilence: body.sentenceSilence, title: current.title });
    const saved = await this.storage.save('files', 'mp3', result.mp3);
    const durationSeconds = Math.round(result.durationSeconds);
    const licenseName = updateLicenseVoiceCredit(current.licenseName);
    let r: Resource;
    try {
      r = await this.prisma.resource.update({
        where: { id },
        data: {
          filePath: saved.key, fileMime: 'audio/mpeg', fileSha256: saved.sha256, fileSizeBytes: saved.sizeBytes, format: 'MP3',
          durationSeconds, narrator: TTS_VOICE_CREDIT, licenseName,
        },
      });
    } catch (e) {
      await this.storage.delete(saved.key).catch(() => undefined);
      throw e;
    }
    if (current.filePath && current.filePath !== saved.key) await this.storage.delete(current.filePath).catch(() => undefined);
    await this.audit.log(actorId, 'RESOURCE_NARRATE', 'Resource', id, {
      key: saved.key, sha256: saved.sha256, sizeBytes: saved.sizeBytes, format: 'MP3', durationSeconds,
      chars: result.chars, chunks: result.chunks, elapsedMs: result.elapsedMs, voice: TTS_VOICE_CREDIT,
      textSource: body.text ? 'body' : 'extra.text', licenseNameChanged: licenseName !== current.licenseName,
    });
    return toResourceDTO(r);
  }

  /**
   * Galería ZIP: valida estructura y gallery.json, guarda cada imagen como objeto propio
   * (`galleries/<uuid>.<ext>`) y el ZIP original como archivo del recurso (su SHA-256 es el del ZIP).
   */
  private async attachGallery(current: Resource, file: Express.Multer.File, actorId: string): Promise<ResourceDTO> {
    let extracted;
    try {
      extracted = await extractGalleryZip(file.path, file.size);
    } catch (e) {
      if (e instanceof GalleryZipError) {
        throw e.kind === 'format' ? new UnsupportedMediaTypeException(e.message) : new BadRequestException(e.message);
      }
      throw e;
    }
    const savedKeys: string[] = [];
    try {
      const items: StoredGallery['items'] = [];
      for (const img of extracted.images) {
        const s = await this.storage.save('galleries', img.ext, img.data);
        savedKeys.push(s.key);
        const { file: _f, ...meta } = img.item;
        items.push({ ...meta, licenseUrl: meta.licenseUrl ?? null, sourceUrl: meta.sourceUrl ?? null, key: s.key, mime: img.mime, sha256: s.sha256, sizeBytes: s.sizeBytes });
      }
      const zip = await this.storage.save('files', 'zip', createReadStream(file.path));
      savedKeys.push(zip.key);
      const gallery: StoredGallery = {
        title: extracted.manifest.title,
        description: extracted.manifest.description,
        items,
        activity: extracted.manifest.activity ?? null,
      };
      const r = await this.prisma.resource.update({
        where: { id: current.id },
        data: {
          filePath: zip.key, fileMime: 'application/zip', fileSha256: zip.sha256, fileSizeBytes: zip.sizeBytes, format: 'IMAGE_SET',
          gallery: JSON.parse(JSON.stringify(gallery)) as Prisma.InputJsonValue,
        },
      });
      // Limpieza de la versión anterior (archivo y sus imágenes).
      const old = storedGalleryOf(current.gallery);
      const oldKeys = [current.filePath, ...(old?.items.map((i) => i.key) ?? [])].filter((k): k is string => !!k);
      for (const k of oldKeys) if (!savedKeys.includes(k)) await this.storage.delete(k).catch(() => undefined);
      await this.audit.log(actorId, 'RESOURCE_FILE_UPLOAD', 'Resource', current.id, {
        key: zip.key, sha256: zip.sha256, sizeBytes: zip.sizeBytes, format: 'IMAGE_SET', images: items.length,
      });
      return toResourceDTO(r);
    } catch (e) {
      for (const k of savedKeys) await this.storage.delete(k).catch(() => undefined);
      throw e;
    }
  }
}

function pick(obj: object, keys: string[]): Record<string, unknown> {
  const src = obj as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => k in src).map((k) => [k, src[k]]));
}
