import type { Readable } from 'node:stream';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export type StorageNamespace = 'files' | 'covers' | 'galleries';

export interface SavedObject {
  key: string;
  sizeBytes: number;
  sha256: string;
}

export interface ObjectStat {
  sizeBytes: number;
}

export interface ByteRange {
  start: number;
  /** inclusivo */
  end: number;
}

/**
 * Abstracción de almacenamiento de archivos.
 * Las claves (`key`) siempre las genera el servidor: `<namespace>/<uuid>.<ext>`.
 * Implementaciones: LocalStorageProvider (disco). Seam para S3/MinIO: implementar esta
 * interfaz (p.ej. S3StorageProvider con GetObject + Range) y registrarla en StorageModule
 * según STORAGE_DRIVER.
 */
export interface StorageProvider {
  /** Guarda un stream o buffer; calcula sha256 y tamaño. */
  save(namespace: StorageNamespace, ext: string, data: Readable | Buffer): Promise<SavedObject>;
  /**
   * Escribe un objeto DERIVADO con clave determinista (p. ej. `thumbs/<uuid>-w240.webp`), reemplazando
   * el anterior si existe (escritura atómica). Solo admite claves válidas según `isValidStorageKey`.
   */
  put(key: string, data: Buffer): Promise<void>;
  /** Stream de lectura, opcionalmente de un rango de bytes. */
  createReadStream(key: string, range?: ByteRange): Promise<Readable>;
  stat(key: string): Promise<ObjectStat | null>;
  delete(key: string): Promise<void>;
}

const KEY_RE = /^(files|covers|galleries)\/[a-f0-9-]{36}\.[a-z0-9]{1,8}$/;
/** Miniaturas de portada: derivadas de `covers/<uuid>.<ext>` → `thumbs/<uuid>-w<ancho>.webp`. */
const THUMB_KEY_RE = /^thumbs\/[a-f0-9-]{36}-w\d{2,4}\.webp$/;
export function isValidStorageKey(key: string): boolean {
  return KEY_RE.test(key) || THUMB_KEY_RE.test(key);
}

/** Clave de la miniatura de una portada. Lanza si la clave de portada no es válida. */
export function thumbKeyFor(coverKey: string, width: number): string {
  if (!KEY_RE.test(coverKey) || !coverKey.startsWith('covers/')) throw new Error('Clave de portada inválida');
  const uuid = coverKey.slice('covers/'.length, coverKey.lastIndexOf('.'));
  return `thumbs/${uuid}-w${width}.webp`;
}
