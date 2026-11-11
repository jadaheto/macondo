import { readJSON, writeJSON } from './storage';

export const FAVORITES_KEY = 'macondo.favorites';

export function getFavorites(): string[] {
  const v = readJSON<unknown>(FAVORITES_KEY, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
export function isFavorite(id: string) {
  return getFavorites().includes(id);
}
export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  writeJSON(FAVORITES_KEY, next);
  return next.includes(id);
}
