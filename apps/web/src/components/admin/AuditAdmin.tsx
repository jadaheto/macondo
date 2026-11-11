'use client';

import { useMemo, useState } from 'react';
import { API_ROUTES } from '@macondo/shared';
import { useApi } from '../useApi';
import { normalizeAudit } from '@/lib/adminData';
import { AdminEmpty, AdminError, AdminLoading, Badge, formatDateTime, InboxHero, Ri } from './ui';

function actionTone(a: string): 'success' | 'danger' | 'info' | 'warning' | 'secondary' {
  if (/DELETE|RETIRE/.test(a)) return 'danger';
  if (/PUBLISH|CREATE|LOGIN/.test(a)) return 'success';
  if (/UPDATE|STATUS|UPLOAD/.test(a)) return 'info';
  return 'secondary';
}

/** Auditoría administrativa (solo ADMIN). */
export function AuditAdmin({ token }: { token: string }) {
  const { data, error, loading, reload } = useApi<unknown>(API_ROUTES.adminAudit, token);
  const [q, setQ] = useState('');
  const rows = useMemo(() => normalizeAudit(data), [data]);
  const term = q.trim().toLowerCase();
  const visible = term ? rows.filter((r) => `${r.actor} ${r.action} ${r.target}`.toLowerCase().includes(term)) : rows;

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Auditoría administrativa"
        subtitle="Últimas acciones del personal sobre la colección y la programación. Solo visible para administradores."
        actions={
          <button type="button" className="btn btn-pqr-report" onClick={reload} disabled={loading}>
            <Ri name="refresh-line" className="me-1" />Actualizar
          </button>
        }
      />
      <section className="card pqr-card pqr-inbox-card" aria-label="Registro de auditoría">
        <div className="pqr-inbox-toolbar madm-toolbar-simple">
          <div className="pqr-inbox-search">
            <Ri name="search-line" />
            <label className="visually-hidden" htmlFor="aud-q">Buscar en auditoría</label>
            <input id="aud-q" type="search" className="form-control" placeholder="Usuario, acción u objeto" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div id="pqrResults" aria-busy={loading}>
          {loading && <AdminLoading label="Cargando auditoría…" />}
          {error && <div className="p-3"><AdminError message={error.message} onRetry={reload} /></div>}
          {!loading && !error && rows.length === 0 && <AdminEmpty title="Sin acciones registradas" icon="shield-check-line" />}
          {!loading && !error && rows.length > 0 && visible.length === 0 && <AdminEmpty title="Ninguna acción coincide con la búsqueda" icon="search-line" />}
          {!loading && !error && visible.length > 0 && (
            <>
              <div className="pqr-desktop-list table-responsive">
                <table className="table pqr-inbox-table madm-t-audit align-middle mb-0">
                  <caption className="visually-hidden">Acciones administrativas recientes</caption>
                  <thead><tr><th scope="col">Fecha</th><th scope="col">Usuario</th><th scope="col">Acción</th><th scope="col">Objeto</th></tr></thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id}>
                        <td className="text-nowrap">{formatDateTime(r.at)}</td>
                        <td className="madm-break">{r.actor}</td>
                        <td><Badge tone={actionTone(r.action)}>{r.action}</Badge></td>
                        <td className="madm-break madm-small">{r.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pqr-mobile-list">
                {visible.map((r) => (
                  <article key={r.id} className="pqr-mobile-card">
                    <div className="pqr-mobile-top">
                      <div className="madm-min0">
                        <strong className="pqr-radicado madm-break">{r.actor}</strong>
                        <small className="d-block text-muted">{formatDateTime(r.at)}</small>
                      </div>
                      <Badge tone={actionTone(r.action)}>{r.action}</Badge>
                    </div>
                    <p className="small text-muted mb-0 madm-break">{r.target}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
        {!loading && !error && rows.length > 0 && (
          <div className="pqr-pagination pqr-inbox-pagination"><span aria-live="polite">{visible.length} de {rows.length} acciones</span></div>
        )}
      </section>
    </div>
  );
}
