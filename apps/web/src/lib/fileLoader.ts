import { API_ROUTES } from '@macondo/shared';
import { messageForStatus, NETWORK_ERROR_MESSAGE, ApiError } from './api';

/**
 * Descarga el archivo del recurso como ArrayBuffer. Pasa por el service worker, que lo sirve
 * desde la caché offline si no hay red y el recurso fue descargado y verificado.
 */
export async function fetchResourceFile(id: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  let res: Response;
  try {
    res = await fetch(API_ROUTES.resourceFile(id), { signal });
  } catch {
    throw new ApiError('network', NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) throw new ApiError('http', messageForStatus(res.status), res.status);
  return res.arrayBuffer();
}
