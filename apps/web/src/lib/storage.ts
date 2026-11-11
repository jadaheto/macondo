/**
 * Acceso seguro a localStorage/sessionStorage: nunca lanza (modo privado, WebView sin
 * almacenamiento, cuota llena). Todas las claves del proyecto usan el prefijo `macondo.`.
 */
export const STORAGE_PREFIX = 'macondo.';

type Area = 'local' | 'session';

function area(kind: Area): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Area = 'local'): T {
  const s = area(kind);
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = 'local'): boolean {
  const s = area(kind);
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, kind: Area = 'local'): void {
  const s = area(kind);
  try {
    s?.removeItem(key);
  } catch {
    /* ignorar */
  }
}

/** Elimina todas las claves `macondo.*` excepto las indicadas. Devuelve las claves borradas. */
export function clearPrefixed(keep: string[] = [], kind: Area = 'local'): string[] {
  const s = area(kind);
  if (!s) return [];
  const removed: string[] = [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && !keep.includes(k)) keys.push(k);
    }
    for (const k of keys) {
      s.removeItem(k);
      removed.push(k);
    }
  } catch {
    /* ignorar */
  }
  return removed;
}
