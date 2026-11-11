'use client';

import { BAND_CONFIG, GRADE_BANDS, type GradeBand } from '@/lib/gradeBand';
import { useGradeBand } from './GradeBandProvider';
import { Icon, type IconName } from './Icon';

/**
 * Selector de banda de grado. PROPUESTA de adaptación infantil sobre la paleta PQR: cada banda usa
 * una variación de azul/turquesa/verde de la marca, con tamaños decrecientes (1.º–3.º más grande).
 */
const BAND_STYLE: Record<GradeBand, { card: string; badge: string; icon: IconName; size: string }> = {
  '1-3': { card: 'bg-brand-info-bg border-brand-accent', badge: 'bg-brand-accent-strong', icon: 'estrella', size: 'text-4xl' },
  '4-5': { card: 'bg-brand-success-bg border-brand-positive', badge: 'bg-brand-positive-strong', icon: 'libro', size: 'text-3xl' },
  '6-8': { card: 'bg-brand-soft border-brand-secondary', badge: 'bg-brand-secondary', icon: 'audifonos', size: 'text-3xl' },
  '9-11': { card: 'bg-brand-surface border-brand-primary', badge: 'bg-brand-primary', icon: 'bombillo', size: 'text-2xl' },
};

export function BandChooser({ onChosen }: { onChosen?: (b: GradeBand) => void }) {
  const { band, setBand } = useGradeBand();
  return (
    <section aria-labelledby="titulo-grado" className="mx-auto max-w-3xl text-center">
      <p className="eyebrow">Biblioteca Macondo · Comfasucre</p>
      <h1 id="titulo-grado" className="mt-1 text-3xl font-bold sm:text-4xl">
        ¿En qué grado estás?
      </h1>
      <p className="mt-2 text-brand-muted">Así te mostramos lecturas y botones a tu medida. No necesitas cuenta ni contraseña.</p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GRADE_BANDS.map((b) => {
          const s = BAND_STYLE[b];
          return (
            <li key={b}>
              <button
                type="button"
                onClick={() => {
                  setBand(b);
                  onChosen?.(b);
                }}
                aria-pressed={band === b}
                className={`flex min-h-touch-lg w-full items-center gap-4 rounded-panel border-2 px-5 py-5 text-left text-brand-text shadow-card transition duration-brand hover:-translate-y-0.5 hover:shadow-card-hover ${s.card}`}
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-brand-on-primary ${s.badge}`}>
                  <Icon name={s.icon} className="h-8 w-8" />
                </span>
                <span className="flex flex-col">
                  <span className={`font-bold text-brand-primary ${s.size}`}>{BAND_CONFIG[b].label}</span>
                  <span className="text-sm text-brand-text">Grados {BAND_CONFIG[b].label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
