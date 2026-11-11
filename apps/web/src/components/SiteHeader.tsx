'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGradeBand } from './GradeBandProvider';
import { Wordmark } from './Wordmark';
import { Icon, type IconName } from './Icon';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Inicio', icon: 'casa' },
  { href: '/catalogo', label: 'Catálogo', icon: 'libro' },
  { href: '/retos', label: 'Retos', icon: 'trofeo' },
  { href: '/offline', label: 'Sin conexión', icon: 'nube-off' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { band, config, setBand } = useGradeBand();
  return (
    <header className="border-b border-brand-border bg-brand-surface">
      <a href="#contenido" className="sr-only-focusable btn-primario absolute left-2 top-2 z-50">
        Saltar al contenido
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Wordmark />
        <nav aria-label="Principal" className="max-w-full">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-touch items-center gap-2 rounded-control px-3 font-semibold transition-colors duration-brand ${
                      active ? 'bg-brand-primary text-brand-on-primary' : 'text-brand-secondary hover:bg-brand-soft'
                    }`}
                  >
                    <Icon name={n.icon} className="h-5 w-5" />
                    {n.label}
                  </Link>
                </li>
              );
            })}
            {band && (
              <li>
                <button
                  type="button"
                  onClick={() => setBand(null)}
                  className="inline-flex min-h-touch items-center gap-1 rounded-control border border-brand-border bg-brand-soft px-3 text-sm text-brand-text transition-colors duration-brand hover:border-brand-secondary"
                  aria-label={`Grados ${config.label}. Cambiar grado`}
                >
                  Grados {config.label} · <span className="font-semibold text-brand-secondary underline">Cambiar</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
