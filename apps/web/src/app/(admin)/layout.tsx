import type { Metadata, Viewport } from 'next';

/**
 * Root layout independiente para /admin: perfil administrativo PQR de Comfasucre.
 * Carga los CSS ORIGINALES del kit de branding (branding/branding.md §14.3) en su orden,
 * sin Tailwind, para conservar la identidad. Al ser otro root layout, Next hace recarga
 * completa al cruzar entre /admin y el portal público, así que estos estilos no se filtran.
 */
export const metadata: Metadata = {
  title: { default: 'Administración · Macondo Digital', template: '%s · Administración Macondo Digital' },
  icons: { icon: '/brand/images/favicon.ico' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#17365d', width: 'device-width', initialScale: 1 };

// macondo-admin.css: complemento propio (propuesta), siempre DESPUÉS de pqr.css.
const CSS = ['bootstrap.min.css', 'icons.min.css', 'app.min.css', 'custom.min.css', 'custom.css', 'pqr.css', 'macondo-admin.css'];

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" data-bs-theme="light">
      <head>
        {CSS.map((f) => (
          <link key={f} rel="stylesheet" href={`/brand/css/${f}`} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
