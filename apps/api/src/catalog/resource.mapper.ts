import { isResourceAccessible, type License, type ResourceDTO, type ResourceExtra, ResourceExtraSchema } from '@macondo/shared';
import type { Resource } from '@prisma/client';

export function licenseOf(r: Resource): License {
  return {
    rightsHolder: r.licenseRightsHolder,
    licenseName: r.licenseName,
    licenseUrl: r.licenseUrl,
    authorizedDevices: r.licenseAuthorizedDevices,
    offlineAllowed: r.licenseOfflineAllowed,
    validFrom: r.licenseValidFrom ? r.licenseValidFrom.toISOString() : null,
    validUntil: r.licenseValidUntil ? r.licenseValidUntil.toISOString() : null,
    territory: r.licenseTerritory,
  };
}

export function toResourceDTO(r: Resource, now = new Date()): ResourceDTO {
  const license = licenseOf(r);
  return {
    id: r.id,
    title: r.title,
    creator: r.creator,
    type: r.type,
    description: r.description,
    gradeMin: r.gradeMin,
    gradeMax: r.gradeMax,
    categories: r.categories,
    language: r.language,
    narrator: r.narrator,
    durationSeconds: r.durationSeconds,
    format: r.format,
    hasFile: !!r.filePath,
    hasCover: !!r.coverPath,
    fileSha256: r.fileSha256,
    fileSizeBytes: r.fileSizeBytes,
    status: r.status,
    license,
    extra: extraOf(r.extra),
    accessible: isResourceAccessible({ status: r.status, license }, now),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** Convierte la licencia del contrato a columnas aplanadas de Prisma. */
export function licenseToColumns(l: Partial<License>) {
  const out: Record<string, unknown> = {};
  if (l.rightsHolder !== undefined) out.licenseRightsHolder = l.rightsHolder;
  if (l.licenseName !== undefined) out.licenseName = l.licenseName;
  if (l.licenseUrl !== undefined) out.licenseUrl = l.licenseUrl ?? null;
  if (l.authorizedDevices !== undefined) out.licenseAuthorizedDevices = l.authorizedDevices;
  if (l.offlineAllowed !== undefined) out.licenseOfflineAllowed = l.offlineAllowed;
  if (l.validFrom !== undefined) out.licenseValidFrom = l.validFrom ? new Date(l.validFrom) : null;
  if (l.validUntil !== undefined) out.licenseValidUntil = l.validUntil ? new Date(l.validUntil) : null;
  if (l.territory !== undefined) out.licenseTerritory = l.territory;
  return out as {
    licenseRightsHolder?: string; licenseName?: string; licenseUrl?: string | null; licenseAuthorizedDevices?: number;
    licenseOfflineAllowed?: boolean; licenseValidFrom?: Date | null; licenseValidUntil?: Date | null; licenseTerritory?: string;
  };
}

/** Extra guardado como JSON: se revalida al leer (datos antiguos o manuales no rompen el DTO). */
export function extraOf(v: unknown): ResourceExtra | null {
  if (v == null || typeof v !== 'object') return null;
  const parsed = ResourceExtraSchema.safeParse(v);
  return parsed.success ? parsed.data : null;
}
