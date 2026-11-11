import { readJSON, writeJSON } from './storage';

/** Progreso de lectura guardado solo en este dispositivo (sin cuentas de estudiantes). */
export interface ReadingState {
  /** EPUB: CFI de la ubicación actual. */
  cfi?: string;
  /** PDF: página actual. */
  page?: number;
  /** 0..1 */
  percent?: number;
  bookmarks: Bookmark[];
  fontSize?: number;
  zoom?: number;
  updatedAt: string;
}
export interface Bookmark {
  id: string;
  label: string;
  cfi?: string;
  page?: number;
  createdAt: string;
}

const key = (id: string) => `macondo.reading.${id}`;

export function loadReading(id: string): ReadingState {
  const v = readJSON<Partial<ReadingState> | null>(key(id), null);
  return {
    bookmarks: Array.isArray(v?.bookmarks) ? v!.bookmarks : [],
    cfi: typeof v?.cfi === 'string' ? v.cfi : undefined,
    page: typeof v?.page === 'number' ? v.page : undefined,
    percent: typeof v?.percent === 'number' ? v.percent : undefined,
    fontSize: typeof v?.fontSize === 'number' ? v.fontSize : undefined,
    zoom: typeof v?.zoom === 'number' ? v.zoom : undefined,
    updatedAt: v?.updatedAt ?? new Date(0).toISOString(),
  };
}

export function saveReading(id: string, patch: Partial<ReadingState>) {
  const current = loadReading(id);
  writeJSON(key(id), { ...current, ...patch, updatedAt: new Date().toISOString() });
}

export function addBookmark(id: string, b: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark[] {
  const s = loadReading(id);
  const exists = s.bookmarks.some((x) => (b.cfi && x.cfi === b.cfi) || (b.page != null && x.page === b.page));
  if (exists) return s.bookmarks;
  const next = [...s.bookmarks, { ...b, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() }];
  saveReading(id, { bookmarks: next });
  return next;
}

export function removeBookmark(id: string, bookmarkId: string): Bookmark[] {
  const s = loadReading(id);
  const next = s.bookmarks.filter((b) => b.id !== bookmarkId);
  saveReading(id, { bookmarks: next });
  return next;
}
