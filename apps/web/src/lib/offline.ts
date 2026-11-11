/**
 * Descarga para uso sin conexión (primera iteración).
 *
 * Flujo: el usuario pulsa "Descargar para uso sin conexión" → se consulta /api/offline/manifest
 * (solo incluye recursos con licencia que permite offline) → se descarga el archivo → se verifica
 * SHA-256 con SubtleCrypto → solo si coincide se guarda en Cache Storage y se marca disponible.
 * El service worker (public/sw.js) sirve el archivo desde esa caché cuando no hay red.
 * Galerías (IMAGE_SET): se descargan las imágenes una a una (cada una con su SHA-256 del manifest)
 * y el JSON de la galería; solo se guarda si TODAS las imágenes pasan la verificación.
 *
 * ADVERTENCIA: la persistencia de Cache Storage / localStorage en Fire OS (Silk / WebView) tras
 * reinicios, limpieza automática o poco espacio está PENDIENTE DE VALIDACIÓN FÍSICA en una Fire HD 10
 * real. Si no persiste, se evaluará un contenedor nativo (ver docs/OFFLINE.md).
 */
import { API_ROUTES, type OfflineManifest, type OfflineManifestEntry, type ResourceDTO } from '@macondo/shared';
import { apiFetch, ApiError } from './api';
import { verifySha256 } from './sha256';
import { readJSON, writeJSON } from './storage';

export const OFFLINE_CACHE = 'macondo-offline-v1';
export const OFFLINE_INDEX_KEY = 'macondo.offline.index';

export interface OfflineRecord {
  id: string;
  title: string;
  version: string;
  sha256: string;
  sizeBytes: number;
  fileUrl: string;
  coverUrl: string | null;
  licenseValidUntil: string | null;
  savedAt: string;
  resource?: ResourceDTO;
  /** IMAGE_SET: URLs de imágenes y del JSON de la galería guardados en la caché offline. */
  assetUrls?: string[];
  galleryUrl?: string;
}

export interface OfflineDownloadItem { url: string; sha256: string; sizeBytes: number; mime?: string }

/**
 * Qué se descarga para un recurso: el archivo principal o, en galerías (IMAGE_SET), cada imagen
 * por separado (el visor no usa el ZIP). Cada elemento se verifica con su propio SHA-256.
 */
export function planOfflineDownload(entry: OfflineManifestEntry): OfflineDownloadItem[] {
  if (entry.format === 'IMAGE_SET' && entry.assets && entry.assets.length > 0 && entry.galleryUrl) {
    return entry.assets.map((a) => ({ url: a.url, sha256: a.sha256, sizeBytes: a.sizeBytes, mime: a.mime }));
  }
  return [{ url: entry.fileUrl, sha256: entry.sha256, sizeBytes: entry.sizeBytes }];
}

export class OfflineError extends Error {
  constructor(
    readonly code: 'unsupported' | 'not-authorized' | 'storage' | 'integrity' | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'OfflineError';
  }
}

export function getOfflineIndex(): Record<string, OfflineRecord> {
  const v = readJSON<Record<string, OfflineRecord>>(OFFLINE_INDEX_KEY, {});
  return v && typeof v === 'object' ? v : {};
}

export function isLicenseStillValid(rec: Pick<OfflineRecord, 'licenseValidUntil'>, now = new Date()) {
  return !rec.licenseValidUntil || new Date(rec.licenseValidUntil) >= now;
}

export function getOfflineRecord(id: string): OfflineRecord | null {
  const rec = getOfflineIndex()[id];
  if (!rec) return null;
  if (!isLicenseStillValid(rec)) return null; // licencia vencida: no se ofrece offline
  return rec;
}

export function offlineSupported(): boolean {
  return typeof window !== 'undefined' && 'caches' in window && !!window.crypto?.subtle;
}

export async function ensureStorageFor(bytes: number): Promise<void> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota != null && est.usage != null) {
      const free = est.quota - est.usage;
      if (free < bytes * 1.2) {
        throw new OfflineError('storage', 'No hay espacio suficiente en este dispositivo para guardar el recurso.');
      }
    }
  } catch (e) {
    if (e instanceof OfflineError) throw e;
    /* estimate no disponible: continuar */
  }
}

export async function downloadForOffline(
  id: string,
  resource?: ResourceDTO,
  onProgress?: (fraction: number) => void,
): Promise<OfflineRecord> {
  if (!offlineSupported()) {
    throw new OfflineError('unsupported', 'Este navegador no permite guardar recursos sin conexión.');
  }
  let manifest: OfflineManifest;
  try {
    manifest = await apiFetch<OfflineManifest>(API_ROUTES.offlineManifest);
  } catch (e) {
    throw new OfflineError('network', e instanceof ApiError ? e.message : 'No se pudo obtener el manifiesto offline.');
  }
  const entry: OfflineManifestEntry | undefined = manifest?.entries?.find((x) => x.id === id);
  if (!entry) {
    throw new OfflineError('not-authorized', 'La licencia de este recurso no permite descargarlo para uso sin conexión.');
  }
  const plan = planOfflineDownload(entry);
  const totalBytes = plan.reduce((a, x) => a + x.sizeBytes, 0);
  await ensureStorageFor(totalBytes);

  // 1) Descargar y verificar TODO antes de guardar nada (sin copias a medias).
  const verified: { item: OfflineDownloadItem; buf: ArrayBuffer; type: string }[] = [];
  let done = 0;
  for (const item of plan) {
    let res: Response;
    try {
      res = await fetch(item.url, { cache: 'no-store' });
    } catch {
      throw new OfflineError('network', 'Se perdió la conexión durante la descarga. Inténtalo de nuevo.');
    }
    if (!res.ok) throw new OfflineError('network', `No se pudo descargar el archivo (código ${res.status}).`);
    const base = done;
    const buf = await readWithProgress(res, item.sizeBytes, onProgress && totalBytes ? (f) => onProgress(Math.min(1, (base + f * item.sizeBytes) / totalBytes)) : undefined);
    if (!(await verifySha256(buf, item.sha256))) {
      throw new OfflineError('integrity', 'El archivo descargado está dañado o incompleto (la verificación de integridad falló). No se guardó.');
    }
    done += item.sizeBytes;
    verified.push({ item, buf, type: res.headers.get('Content-Type') ?? item.mime ?? 'application/octet-stream' });
  }
  let galleryJson: string | null = null;
  if (entry.format === 'IMAGE_SET' && entry.galleryUrl && plan[0]?.url !== entry.fileUrl) {
    try {
      const gr = await fetch(entry.galleryUrl, { cache: 'no-store' });
      if (!gr.ok) throw new Error(String(gr.status));
      galleryJson = await gr.text();
    } catch {
      throw new OfflineError('network', 'No se pudo descargar la descripción de la galería.');
    }
  }

  // 2) Guardar en Cache Storage.
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    for (const v of verified) {
      await cache.put(
        v.item.url,
        new Response(v.buf, {
          headers: { 'Content-Type': v.type, 'Content-Length': String(v.buf.byteLength), 'X-Macondo-Sha256': v.item.sha256 },
        }),
      );
    }
    if (galleryJson != null && entry.galleryUrl) {
      await cache.put(entry.galleryUrl, new Response(galleryJson, { headers: { 'Content-Type': 'application/json' } }));
    }
    if (entry.coverUrl) {
      try {
        const c = await fetch(entry.coverUrl);
        if (c.ok) await cache.put(entry.coverUrl, c);
      } catch {
        /* portada opcional */
      }
    }
    // Pedir almacenamiento persistente (el navegador puede negarlo).
    await navigator.storage?.persist?.().catch(() => false);
  } catch {
    throw new OfflineError('storage', 'No se pudo guardar el archivo en el dispositivo (¿espacio insuficiente?).');
  }
  const isGallery = galleryJson != null;

  const rec: OfflineRecord = {
    id: entry.id,
    title: entry.title,
    version: entry.version,
    sha256: entry.sha256,
    sizeBytes: entry.sizeBytes,
    fileUrl: entry.fileUrl,
    coverUrl: entry.coverUrl,
    licenseValidUntil: entry.licenseValidUntil,
    savedAt: new Date().toISOString(),
    resource,
    ...(isGallery ? { assetUrls: plan.map((x) => x.url), galleryUrl: entry.galleryUrl } : {}),
  };
  writeJSON(OFFLINE_INDEX_KEY, { ...getOfflineIndex(), [id]: rec });
  return rec;
}

async function readWithProgress(res: Response, expected: number, onProgress?: (f: number) => void): Promise<ArrayBuffer> {
  if (!res.body || !onProgress || !expected) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress(Math.min(1, received / expected));
    }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

export async function removeOffline(id: string): Promise<void> {
  const index = getOfflineIndex();
  const rec = index[id];
  if (rec && 'caches' in window) {
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.delete(rec.fileUrl);
      if (rec.coverUrl) await cache.delete(rec.coverUrl);
      for (const u of rec.assetUrls ?? []) await cache.delete(u);
      if (rec.galleryUrl) await cache.delete(rec.galleryUrl);
    } catch {
      /* ignorar */
    }
  }
  delete index[id];
  writeJSON(OFFLINE_INDEX_KEY, index);
}

/** Página que abre un recurso descargado: las galerías tienen visor propio. */
export function offlinePagePath(rec: Pick<OfflineRecord, 'id' | 'galleryUrl' | 'assetUrls'> & { resource?: Pick<ResourceDTO, 'type'> }): string {
  const isGallery = !!rec.galleryUrl || (rec.assetUrls?.length ?? 0) > 0 || rec.resource?.type === 'GALLERY';
  return isGallery ? `/galeria/${rec.id}` : `/leer/${rec.id}`;
}

/**
 * Deja lista para uso sin conexión la PÁGINA que abre el recurso (no solo el archivo): la carga
 * una vez en un iframe oculto para que el service worker guarde su HTML y sus módulos JS,
 * incluidos los que se cargan bajo demanda (epub.js, pdf.js, visor de galería). Sin esto, un
 * recurso descargado desde su ficha no abría sin red si su lector no se había visitado antes
 * (hallazgo de la simulación Fire HD 10, 2026-11-01). Mejor esfuerzo: nunca lanza.
 */
export function warmOfflinePage(path: string, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !navigator.serviceWorker?.controller) return resolve();
    const frame = document.createElement('iframe');
    frame.src = path;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.title = 'Preparando uso sin conexión';
    frame.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0;visibility:hidden';
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      frame.remove();
      resolve();
    };
    // tras el load, margen para que el lector monte y pida sus módulos dinámicos
    frame.addEventListener('load', () => setTimeout(finish, 4000));
    setTimeout(finish, timeoutMs);
    document.body.appendChild(frame);
  });
}
