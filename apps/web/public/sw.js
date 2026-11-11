/*
 * Service worker de Macondo Digital (primera iteración, deliberadamente simple).
 *
 * - Precarga el "app shell" (páginas principales, manifest, ícono, worker de pdf.js).
 * - Navegación: red primero; si no hay red, copia en caché o página /offline.
 * - /_next/static/*: caché primero (archivos con hash inmutables).
 * - GET /api/resources/:id (fichas): red primero con copia en caché de ejecución.
 * - GET /api/resources/:id/file|cover|gallery|gallery/:n: red primero (la API aplica la licencia); si no hay red,
 *   se sirven desde la caché OFFLINE, donde solo se guardan archivos descargados explícitamente
 *   por el usuario y verificados con SHA-256 (ver src/lib/offline.ts). Admite peticiones Range.
 * - Nunca se cachean /api/auth, /api/admin ni /api/tv.
 *
 * PERSISTENCIA EN FIRE OS (Silk / WebView): PENDIENTE DE VALIDACIÓN FÍSICA en Fire HD 10.
 */
const VERSION = 'v5'; // v3: galerías desde la caché offline · v4: portadas con ?w= · v5: /construye-tu-cuento en el shell
const SHELL_CACHE = 'macondo-shell-' + VERSION;
const RUNTIME_CACHE = 'macondo-runtime-' + VERSION;
const OFFLINE_CACHE = 'macondo-offline-v1'; // compartida con src/lib/offline.ts (no versionar aquí)
const BRAND_URLS = [
  '/brand/css/fonts-local.css',
  '/brand/fonts/web/outfit-latin-20261003.woff2',
  '/brand/fonts/web/outfit-latin-ext-20261003.woff2',
  '/brand/images/logo_comfasucre.png',
  '/brand/images/favicon.ico',
  '/icons/comfasucre-192.png',
];
const SHELL_URLS = ['/', '/catalogo', '/retos', '/construye-tu-cuento', '/offline', '/manifest.webmanifest', '/icon.svg', '/pdf.worker.min.mjs', ...BRAND_URLS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(SHELL_URLS.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => undefined))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('macondo-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE && k !== OFFLINE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isFileOrCover(pathname) {
  return /^\/api\/resources\/[^/]+\/(file|cover|gallery|gallery\/\d{1,3})$/.test(pathname);
}

async function rangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;
  const buf = await response.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return new Response(buf, { status: 200, headers: response.headers });
  let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
  let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (end >= size) end = size - 1;
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}

async function fromOfflineCache(request, pathname) {
  const cache = await caches.open(OFFLINE_CACHE);
  // Las portadas se guardan con su consulta (?w=240, miniatura): primero la URL exacta y, si no,
  // cualquier variante de la misma ruta (una portada pequeña sigue siendo útil sin red).
  const hit = (await cache.match(request.url)) || (await cache.match(pathname, { ignoreSearch: true }));
  if (!hit) return null;
  return rangeResponse(request, hit);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;

  if (p.startsWith('/api/auth') || p.startsWith('/api/admin') || p.startsWith('/api/tv') || p.startsWith('/api/offline')) return;

  if (isFileOrCover(p)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await fromOfflineCache(request, p);
        return cached || new Response('Sin conexión y sin copia local.', { status: 503 });
      }),
    );
    return;
  }

  if (/^\/api\/resources\/[^/]+$/.test(p)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || new Response('{"message":"Sin conexión"}', { status: 503, headers: { 'Content-Type': 'application/json' } })),
    );
    return;
  }

  if (p.startsWith('/api/')) return; // resto de la API: siempre red

  if (p.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Recursos de marca (CSS de fuentes, WOFF2, logotipo): caché primero, para el uso sin conexión.
  if (p.startsWith('/brand/') || p.startsWith('/icons/')) {
    event.respondWith(caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !p.startsWith('/admin')) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true })) || (await caches.match('/offline')) || Response.error()),
    );
  }
});
