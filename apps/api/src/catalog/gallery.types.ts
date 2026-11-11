import type { GalleryActivity } from '@macondo/shared';

/** Forma de Resource.gallery (JSON) tal como la guarda la API. */
export interface StoredGalleryItem {
  key: string; mime: string; sha256: string; sizeBytes: number;
  alt: string; caption: string; credit: string; license: string; licenseUrl: string | null; sourceUrl: string | null;
}
export interface StoredGallery { title: string; description: string; items: StoredGalleryItem[]; activity: GalleryActivity | null }

export function storedGalleryOf(v: unknown): StoredGallery | null {
  if (!v || typeof v !== 'object') return null;
  const g = v as Partial<StoredGallery>;
  if (!Array.isArray(g.items)) return null;
  return { title: String(g.title ?? ''), description: String(g.description ?? ''), items: g.items, activity: g.activity ?? null };
}
