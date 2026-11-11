'use client';

import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Estados de carga, error, vacío y parcial (branding.md §6: diferenciar esperando, ausencia, parcial y error). */
export function Cargando({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-12 text-brand-muted">
      <Icon name="cargando" className="h-10 w-10 animate-girar text-brand-accent" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorEstado({ message, onRetry, title = 'Algo no salió bien' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="tarjeta mx-auto my-8 max-w-xl border-l-4 border-l-brand-danger-text p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-danger-bg text-brand-danger-text">
        <Icon name="error" className="h-7 w-7" />
      </span>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-brand-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primario mt-4">
          <Icon name="refrescar" className="h-5 w-5" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Vacio({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto my-8 max-w-xl text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-secondary">
        <Icon name="vacio" className="h-8 w-8" />
      </span>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      {children && <div className="mt-2 text-brand-muted">{children}</div>}
    </div>
  );
}

/** Aviso de resultado parcial / información guardada (se conserva lo recibido). */
export function AvisoParcial({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-control border border-brand-warning-text/30 bg-brand-warning-bg px-3 py-2 text-sm text-brand-warning-text">
      <Icon name="info" className="mt-0.5 h-5 w-5" />
      <span>{children}</span>
    </p>
  );
}
