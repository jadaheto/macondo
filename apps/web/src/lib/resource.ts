import {
  API_ROUTES,
  RESOURCE_TYPE_LABELS,
  canDownloadOffline,
  type CoverThumbWidth,
  isLicenseActive,
  type ResourceDTO,
  type ResourceType,
} from '@macondo/shared';
import type { ModuleId } from './gradeBand';

export const MODULES: { id: ModuleId; title: string; href: string; type?: ResourceType; icon: string }[] = [
  { id: 'biblioteca', title: 'Biblioteca digital', href: '/catalogo?type=BOOK', type: 'BOOK', icon: 'libro' },
  { id: 'audiolibros', title: 'Audiolibros', href: '/catalogo?type=AUDIOBOOK', type: 'AUDIOBOOK', icon: 'audifonos' },
  { id: 'audiobiografias', title: 'Audiobiografías', href: '/catalogo?type=AUDIOBIOGRAPHY', type: 'AUDIOBIOGRAPHY', icon: 'persona' },
  { id: 'audioresumenes', title: 'Audioresúmenes', href: '/catalogo?type=AUDIOSUMMARY', type: 'AUDIOSUMMARY', icon: 'resumen' },
  { id: 'galerias', title: 'Galerías', href: '/catalogo?type=GALLERY', type: 'GALLERY', icon: 'galeria' },
  { id: 'retos', title: 'Retos lectores', href: '/retos', icon: 'trofeo' },
  { id: 'cuentos', title: 'Taller de cuentos', href: '/construye-tu-cuento', icon: 'letra' },
];

export const typeLabel = (t: ResourceType) => RESOURCE_TYPE_LABELS[t] ?? t;

/** URL de la portada; con `w` (240|480) pide la miniatura WebP generada por la API. */
export const coverUrl = (r: Pick<ResourceDTO, 'id' | 'hasCover'>, w?: CoverThumbWidth) => (r.hasCover ? API_ROUTES.resourceCover(r.id, w) : null);
export const fileUrl = (id: string) => API_ROUTES.resourceFile(id);

export const isAudioType = (t: ResourceType) => t === 'AUDIOBOOK' || t === 'AUDIOBIOGRAPHY' || t === 'AUDIOSUMMARY';

export type PrimaryAction = 'leer' | 'escuchar' | 'galeria' | null;
export function primaryAction(r: Pick<ResourceDTO, 'type' | 'format' | 'hasFile'>): PrimaryAction {
  if (r.format === 'EPUB' || r.format === 'PDF') return r.hasFile ? 'leer' : null;
  if (r.format === 'MP3') return r.hasFile ? 'escuchar' : null;
  if (r.format === 'IMAGE_SET' || r.type === 'GALLERY') return 'galeria';
  return null;
}

export function gradeRangeLabel(min: number, max: number) {
  return min === max ? `${min}.º` : `${min}.º a ${max}.º`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Explica en lenguaje claro por qué un recurso no es accesible. */
export function inaccessibleReasons(r: ResourceDTO, now = new Date()): string[] {
  if (r.accessible) return [];
  const reasons: string[] = [];
  if (r.status === 'DRAFT') reasons.push('El recurso todavía está en preparación (borrador).');
  if (r.status === 'RETIRED') reasons.push('El recurso fue retirado de la colección.');
  if (r.license.validFrom && new Date(r.license.validFrom) > now)
    reasons.push(`La licencia empieza a regir el ${formatDate(r.license.validFrom)}.`);
  if (r.license.validUntil && new Date(r.license.validUntil) < now)
    reasons.push(`La licencia venció el ${formatDate(r.license.validUntil)}.`);
  if (reasons.length === 0 && !isLicenseActive(r.license, now)) reasons.push('La licencia no está vigente.');
  if (reasons.length === 0) reasons.push('La biblioteca no tiene autorización vigente para mostrar este recurso.');
  return reasons;
}

export function offlineAllowed(r: ResourceDTO) {
  return canDownloadOffline(r);
}

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
/** Obra relacionada (audioresumen → obra): título exacto sin tildes/mayúsculas; desempata por autor. */
export function findRelated<T extends Pick<ResourceDTO, 'id' | 'title' | 'creator'>>(items: T[], title: string | null | undefined, creator?: string | null, excludeId?: string): T | null {
  if (!title) return null;
  const same = items.filter((r) => r.id !== excludeId && norm(r.title) === norm(title));
  if (same.length === 0) return null;
  return (creator && same.find((r) => norm(r.creator) === norm(creator))) || same[0]!;
}
