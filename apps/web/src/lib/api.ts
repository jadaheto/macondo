import { API_ROUTES, type CatalogQuery } from '@macondo/shared';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse' | 'aborted';

/** Error de API con mensaje listo para mostrar en español. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly details: unknown;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  /** Errores que vale la pena reintentar (red, tiempo agotado, 5xx). */
  get retryable() {
    return this.kind === 'network' || this.kind === 'timeout' || (this.status != null && this.status >= 500);
  }
}

export function messageForStatus(status: number, serverMessage?: string): string {
  switch (status) {
    case 400:
    case 422:
      return serverMessage ? `Datos no válidos: ${serverMessage}` : 'Algunos datos no son válidos. Revisa el formulario.';
    case 401:
      return 'Tu sesión terminó o las credenciales no son correctas. Ingresa de nuevo.';
    case 403:
      return 'Este contenido no está disponible: la licencia no lo permite o no tienes permiso.';
    case 404:
      return 'No encontramos lo que buscas. Puede que ya no esté disponible.';
    case 409:
      return serverMessage ?? 'Hay un conflicto con el estado actual del recurso.';
    case 413:
      return 'El archivo es demasiado grande.';
    case 415:
      return 'Ese tipo de archivo no está permitido.';
    case 429:
      return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
    default:
      if (status >= 500) return 'La biblioteca tuvo un problema en el servidor. Inténtalo de nuevo en unos minutos.';
      return serverMessage ?? `Ocurrió un error inesperado (código ${status}).`;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con la biblioteca. Revisa la conexión a la red de la biblioteca e inténtalo de nuevo.';
export const TIMEOUT_ERROR_MESSAGE = 'La biblioteca está tardando demasiado en responder. Inténtalo de nuevo.';

/** Eventos globales para el indicador de conexión. */
export const NETWORK_FAIL_EVENT = 'macondo:network-fail';
export const NETWORK_OK_EVENT = 'macondo:network-ok';
function emit(name: string) {
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
  } catch {
    /* ignorar */
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
/** El panel admin registra aquí qué hacer ante un 401 (volver al login). */
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  unauthorizedHandler = fn;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** fetch inyectable (pruebas). */
  fetchImpl?: typeof fetch;
}

function extractServerMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const m = (payload as { message?: unknown }).message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return m.filter((x) => typeof x === 'string').join('; ') || undefined;
  return undefined;
}

export async function apiFetch<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, token, signal, timeoutMs = 15000 } = opts;
  const doFetch = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  if (!doFetch) throw new ApiError('network', NETWORK_ERROR_MESSAGE);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let reqBody: BodyInit | undefined;
  if (formData) reqBody = formData;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await doFetch(path, { method, headers, body: reqBody, signal: controller.signal, cache: 'no-store' });
  } catch (e) {
    if (timedOut) throw new ApiError('timeout', TIMEOUT_ERROR_MESSAGE);
    if (signal?.aborted) throw new ApiError('aborted', 'Solicitud cancelada.');
    emit(NETWORK_FAIL_EVENT);
    throw new ApiError('network', NETWORK_ERROR_MESSAGE, null, e);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  const text = await res.text().catch(() => '');
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  // Si el proxy no alcanza la API responde 5xx sin JSON: se trata como servidor caído.
  const proxyDown = res.status >= 500 && typeof payload !== 'object';
  emit(proxyDown ? NETWORK_FAIL_EVENT : NETWORK_OK_EVENT);
  if (!res.ok) {
    // El proxy de Next devuelve 500/502/504 si la API no está levantada.
    const err = new ApiError('http', messageForStatus(res.status, extractServerMessage(payload)), res.status, payload);
    if (res.status === 401 && unauthorizedHandler && token) unauthorizedHandler();
    throw err;
  }
  if (res.status === 204 || !text) return undefined as T;
  if (typeof payload === 'string') {
    throw new ApiError('parse', 'La respuesta del servidor no tiene el formato esperado.', res.status, payload);
  }
  return payload as T;
}

export function catalogUrl(q: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  if (q.q) params.set('q', q.q);
  if (q.type) params.set('type', q.type);
  if (q.grade) params.set('grade', String(q.grade));
  if (q.category) params.set('category', q.category);
  if (q.page && q.page > 1) params.set('page', String(q.page));
  if (q.pageSize) params.set('pageSize', String(q.pageSize));
  const s = params.toString();
  return s ? `${API_ROUTES.catalog}?${s}` : API_ROUTES.catalog;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
