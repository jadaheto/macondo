import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { GradeBandProvider } from '@/components/GradeBandProvider';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: { default: 'Macondo Digital · Biblioteca Macondo', template: '%s · Macondo Digital' },
  description: 'Biblioteca escolar digital de la Biblioteca Macondo de Comfasucre para estudiantes de 1.º a 11.º.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/brand/images/favicon.ico', apple: '/brand/images/favicon.ico' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#17365d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        {/* Outfit local (OFL) del kit de branding Comfasucre. No se cargan los CSS globales de Velzon. */}
        <link rel="stylesheet" href="/brand/css/fonts-local.css" />
        <link rel="preload" href="/brand/fonts/web/outfit-latin-20261003.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <GradeBandProvider>
          {children}
          <ServiceWorkerRegister />
        </GradeBandProvider>
      </body>
    </html>
  );
}
