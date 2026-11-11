'use client';

import Link from 'next/link';
import { useGradeBand } from '@/components/GradeBandProvider';
import { BandChooser } from '@/components/BandChooser';
import { Cargando } from '@/components/StateViews';
import { Icon, type IconName } from '@/components/Icon';
import { MODULES } from '@/lib/resource';
import { moduleVisible } from '@/lib/gradeBand';

/**
 * Módulos con variaciones de azul/turquesa/verde de la marca (texto blanco, ≥5.3:1).
 * PROPUESTA de adaptación infantil: mosaicos grandes y llenos para 1.º–3.º; tarjetas claras con
 * icono en círculo para las bandas mayores (más cerca de la tarjeta PQR).
 */
const MODULE_FILL = [
  'bg-brand-primary',
  'bg-brand-accent-strong',
  'bg-brand-secondary',
  'bg-brand-positive-strong',
  'bg-brand-primary-hover',
  'bg-brand-accent-strong',
  'bg-brand-secondary',
];

export default function HomePage() {
  const { band, config, ready } = useGradeBand();
  if (!ready) return <Cargando />;
  if (!band) return <BandChooser />;

  const xl = config.density === 'xl';
  const compact = config.density === 'compact';
  const gradeParam = `grade=${config.defaultGrade}`;

  return (
    <div>
      <section className="mb-6">
        <p className="eyebrow">Grados {config.label}</p>
        <h1 className={`mt-1 font-bold ${xl ? 'text-4xl' : compact ? 'text-2xl' : 'text-3xl'}`}>{config.greeting}</h1>
        <p className="mt-1 text-brand-muted">{config.subtitle}</p>
      </section>
      <nav aria-label="Módulos">
        <ul className={`grid gap-4 ${xl ? 'grid-cols-2' : config.moduleColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
          {MODULES.filter((m) => moduleVisible(m.id, band)).map((m, i) => {
            const href = m.type ? `${m.href}&${gradeParam}` : m.href;
            const icon = m.icon as IconName;
            if (xl) {
              return (
                <li key={m.id}>
                  <Link
                    href={href}
                    className={`flex h-full min-h-[11rem] flex-col items-center justify-center gap-3 rounded-panel p-4 text-center text-brand-on-primary shadow-card transition duration-brand hover:-translate-y-0.5 hover:shadow-card-hover ${MODULE_FILL[i]}`}
                  >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                      <Icon name={icon} className="h-12 w-12" />
                    </span>
                    <span className="text-2xl font-bold">{config.moduleCopy[m.id]}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={m.id}>
                <Link
                  href={href}
                  className={`tarjeta group flex h-full transition duration-brand hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:shadow-card-hover ${
                    compact ? 'items-start gap-3 p-4' : 'items-center gap-4 p-5'
                  }`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full text-brand-on-primary ${MODULE_FILL[i]} ${
                      compact ? 'h-11 w-11' : 'h-14 w-14'
                    }`}
                  >
                    <Icon name={icon} className={compact ? 'h-6 w-6' : 'h-8 w-8'} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-xl font-bold text-brand-primary group-hover:underline">{m.title}</span>
                    {config.showDescriptions && <span className="text-sm text-brand-muted">{config.moduleCopy[m.id]}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {compact && (
        <aside className="mt-6 flex gap-3 rounded-card border border-brand-border bg-brand-info-bg p-4 text-sm text-brand-text">
          <Icon name="bombillo" className="h-6 w-6 text-brand-info-text" />
          <p>
            <strong className="text-brand-primary">Consejo de lectura crítica:</strong> antes de leer, identifica el tipo de texto y su
            propósito; mientras lees, distingue la tesis de los argumentos; al terminar, pregúntate qué evidencia sustenta cada idea.
          </p>
        </aside>
      )}
    </div>
  );
}
