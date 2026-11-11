import type { Metadata } from 'next';
import Link from 'next/link';
import { ComfasucreLogo } from '@/components/Wordmark';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <main id="contenido" className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <ComfasucreLogo className="h-14 w-[128px]" />
      <h1 className="mt-6 text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-brand-muted">Puede que el enlace haya cambiado. Vuelve al inicio de Macondo Digital.</p>
      <Link href="/" className="btn-primario mt-6"><Icon name="casa" className="h-5 w-5" /> Volver al inicio</Link>
    </main>
  );
}
