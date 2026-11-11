import { apiFetch, ApiError, catalogUrl, NETWORK_ERROR_MESSAGE, setUnauthorizedHandler, NETWORK_FAIL_EVENT } from './api';

const jsonRes = (status: number, body: unknown) =>
  new Response(body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const fail = (p: Promise<unknown>): Promise<ApiError> =>
  p.then(
    () => {
      throw new Error('se esperaba un error');
    },
    (e: ApiError) => e,
  );

describe('cliente API', () => {
  afterEach(() => setUnauthorizedHandler(null));

  it('devuelve el JSON en respuestas OK y envía Bearer', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonRes(200, { ok: 1 }));
    const data = await apiFetch<{ ok: number }>('/api/x', { token: 'abc', fetchImpl });
    expect(data).toEqual({ ok: 1 });
    const [, init] = fetchImpl.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('error de red → ApiError network con mensaje en español y evento global', async () => {
    const listener = vi.fn();
    window.addEventListener(NETWORK_FAIL_EVENT, listener);
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await fail(apiFetch('/api/x', { fetchImpl }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.kind).toBe('network');
    expect(err.message).toBe(NETWORK_ERROR_MESSAGE);
    expect(err.retryable).toBe(true);
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(NETWORK_FAIL_EVENT, listener);
  });

  it('API caída detrás del proxy (500 sin JSON) → mensaje de servidor', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('Internal Server Error', { status: 500 }));
    const err = await fail(apiFetch('/api/x', { fetchImpl }));
    expect(err.status).toBe(500);
    expect(err.message).toMatch(/servidor/);
    expect(err.retryable).toBe(true);
  });

  it('403 de licencia y 404 producen mensajes claros', async () => {
    const e403 = await fail(apiFetch('/api/x', { fetchImpl: vi.fn().mockResolvedValue(jsonRes(403, { message: 'Forbidden' })) }));
    expect(e403.message).toMatch(/licencia/);
    expect(e403.retryable).toBe(false);
    const e404 = await fail(apiFetch('/api/x', { fetchImpl: vi.fn().mockResolvedValue(jsonRes(404, {})) }));
    expect(e404.message).toMatch(/No encontramos/);
  });

  it('400 con mensajes de validación del servidor', async () => {
    const err = await fail(apiFetch('/api/x', { fetchImpl: vi.fn().mockResolvedValue(jsonRes(400, { message: ['title vacío', 'gradeMin'] })) }));
    expect(err.message).toContain('title vacío; gradeMin');
  });

  it('401 con token invoca el manejador de sesión', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const err = await fail(apiFetch('/api/admin/x', { token: 't', fetchImpl: vi.fn().mockResolvedValue(jsonRes(401, {})) }));
    expect(err.isUnauthorized).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('401 sin token (login fallido) no dispara el manejador', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    await apiFetch('/api/auth/login', { method: 'POST', body: {}, fetchImpl: vi.fn().mockResolvedValue(jsonRes(401, {})) }).catch(() => undefined);
    expect(handler).not.toHaveBeenCalled();
  });

  it('204 devuelve undefined y respuesta no JSON en 200 es error de formato', async () => {
    expect(await apiFetch('/api/x', { fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 204 })) })).toBeUndefined();
    const err = await fail(apiFetch('/api/x', { fetchImpl: vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })) }));
    expect(err.kind).toBe('parse');
  });

  it('tiempo agotado → ApiError timeout', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    );
    const p = fail(apiFetch('/api/x', { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 1000 }));
    vi.advanceTimersByTime(1000);
    const err = await p;
    vi.useRealTimers();
    expect(err.kind).toBe('timeout');
  });

  it('construye la URL del catálogo con filtros', () => {
    expect(catalogUrl({})).toBe('/api/resources');
    expect(catalogUrl({ q: 'fábula', type: 'BOOK', grade: 4, page: 2, pageSize: 24 })).toBe('/api/resources?q=f%C3%A1bula&type=BOOK&grade=4&page=2&pageSize=24');
  });
});
