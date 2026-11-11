import { SiteHeader } from '@/components/SiteHeader';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ComfasucreLogo } from '@/components/Wordmark';

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    // Columna a pantalla completa: el <main> crece y el footer queda siempre al fondo,
    // también en páginas cortas (offline, retos, fichas, errores).
    <div className="flex min-h-screen flex-col">
      <OfflineBanner />
      <SiteHeader />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
      <footer className="mt-auto border-t border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-brand-muted sm:flex-row sm:text-left">
          <ComfasucreLogo className="h-9 w-[82px]" />
          <p>
            Macondo Digital · Biblioteca Macondo de Comfasucre — biblioteca escolar. Contenidos usados solo con licencia verificada.
          </p>
        </div>
      </footer>
    </div>
  );
}
