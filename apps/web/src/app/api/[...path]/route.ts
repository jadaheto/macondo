/**
 * Proxy /api/* → API NestJS (red interna). Sustituye al rewrite de next.config, que se colgaba
 * con cuerpos grandes (subidas de MP3/ZIP de varios MB). Aquí el cuerpo y la respuesta se
 * transmiten en streaming (Range/206 para audio incluido) y API_INTERNAL_URL se lee en
 * EJECUCIÓN, no en el build (útil en Docker/EasyPanel).
 */
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'host', 'expect'];

function apiBase(): string {
  return (process.env.API_INTERNAL_URL || 'http://localhost:4100').replace(/\/$/, '');
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await ctx.params;
  const incoming = new URL(req.url);
  const target = `${apiBase()}/api/${path.map(encodeURIComponent).join('/')}${incoming.search}`;

  const headers = new Headers(req.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);
  headers.set('x-forwarded-host', req.headers.get('host') ?? incoming.host);
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: 'manual',
      signal: req.signal,
      cache: 'no-store',
      // Necesario en Node para enviar un ReadableStream como cuerpo.
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ statusCode: 502, message: 'La API de Macondo Digital no está disponible. Intenta de nuevo en unos segundos.' }, { status: 502 });
  }

  const out = new Headers(upstream.headers);
  for (const h of HOP_BY_HOP) out.delete(h);
  // fetch ya descomprimió la respuesta: no reenviar una codificación/longitud que ya no aplica.
  if (out.has('content-encoding')) { out.delete('content-encoding'); out.delete('content-length'); }
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS };
