/** @type {import('next').NextConfig} */
// /api/* lo reenvía src/app/api/[...path]/route.ts (streaming; API_INTERNAL_URL en ejecución).

// Orígenes desde los que se permite usar el servidor de DESARROLLO (tablets/PC en la red local).
// Patrones por segmentos: "192.168.*.*". Solo afecta a `next dev`.
const ALLOWED_DEV_ORIGINS = (process.env.ALLOWED_DEV_ORIGINS || 'localhost,127.0.0.1,192.168.*.*,10.*.*.*,172.*.*.*,*.local')
  .split(',').map((s) => s.trim()).filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ALLOWED_DEV_ORIGINS,
  // Docker/EasyPanel: NEXT_OUTPUT=standalone genera un servidor autónomo (ver apps/web/Dockerfile).
  ...(process.env.NEXT_OUTPUT === 'standalone'
    ? { output: 'standalone', outputFileTracingRoot: new URL('../../', import.meta.url).pathname }
    : {}),
  transpilePackages: ['@macondo/shared'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  webpack(config) {
    // epub.js / pdf.js referencian módulos de Node opcionales que no existen en el navegador.
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
};

export default nextConfig;
