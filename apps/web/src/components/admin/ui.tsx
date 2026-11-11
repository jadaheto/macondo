'use client';

import type { ReactNode } from 'react';
import type { ResourceStatus } from '@macondo/shared';

/**
 * Piezas visuales del panel admin con clases PQR/Bootstrap (branding/branding.md §6, §14.5).
 * No dependen de Tailwind ni de los componentes compartidos del portal.
 */

/** Icono Remix decorativo. */
export function Ri({ name, className = '' }: { name: string; className?: string }) {
  return <i className={`ri-${name} ${className}`.trim()} aria-hidden="true" />;
}

export function AdminLoading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="pqr-empty madm-state" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {label}
    </div>
  );
}

export function AdminError({ title = 'No se pudo cargar la información', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="madm-alert danger" role="alert">
      <Ri name="error-warning-line" />
      <div className="madm-min0">
        <strong>{title}</strong>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={onRetry}>
            <Ri name="refresh-line" className="me-1" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminEmpty({ title, children, icon = 'inbox-line' }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className="pqr-empty madm-state">
      <Ri name={icon} className="madm-empty-icon" />
      <strong className="d-block">{title}</strong>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

export type Tone = 'success' | 'danger' | 'info' | 'warning';
export interface Notice {
  tone: Tone;
  text: string;
}
const NOTICE_ICON: Record<Tone, string> = {
  success: 'checkbox-circle-line',
  danger: 'error-warning-line',
  info: 'information-line',
  warning: 'alert-line',
};

/** Aviso con borde lateral de estado (texto + icono, no solo color). */
export function AdminNotice({ notice, onClose }: { notice: Notice | null; onClose?: () => void }) {
  if (!notice) return null;
  return (
    <div className={`madm-alert ${notice.tone}`} role={notice.tone === 'danger' ? 'alert' : 'status'}>
      <Ri name={NOTICE_ICON[notice.tone]} />
      <p className="flex-grow-1">{notice.text}</p>
      {onClose && (
        <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={onClose} />
      )}
    </div>
  );
}

export const STATUS_LABEL: Record<ResourceStatus, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicado', RETIRED: 'Retirado' };
const STATUS_TONE: Record<ResourceStatus, string> = { PUBLISHED: 'success', DRAFT: 'secondary', RETIRED: 'danger' };
const STATUS_ICON: Record<ResourceStatus, string> = { PUBLISHED: 'checkbox-circle-line', DRAFT: 'draft-line', RETIRED: 'archive-line' };

/** Badge de estado con pareja PQR fondo/texto, icono y texto. */
export function StatusBadge({ status }: { status: ResourceStatus }) {
  return (
    <span className={`pqr-badge ${STATUS_TONE[status]}`}>
      <Ri name={STATUS_ICON[status]} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Badge({ tone, icon, children }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; icon?: string; children: ReactNode }) {
  return (
    <span className={`pqr-badge ${tone}`}>
      {icon && <Ri name={icon} />}
      {children}
    </span>
  );
}

/** Cabecera compacta transparente de bandeja (pqr-inbox-v2). */
export function InboxHero({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <section className="pqr-hero pqr-hero-compact pqr-inbox-hero">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="madm-min0">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="d-flex flex-wrap gap-2 pqr-hero-actions">{actions}</div>}
      </div>
    </section>
  );
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
}
