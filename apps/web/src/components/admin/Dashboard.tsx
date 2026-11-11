'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES, CHALLENGE_TARGET, RESOURCE_TYPES, RESOURCE_TYPE_LABELS, type ResourceDTO, type ResourceStatus, type TtsStatus } from '@macondo/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { normalizeList, normalizeStats, type NormalizedStats } from '@/lib/adminData';
import { ttsStatusLabel } from '@/lib/narration';
import { AdminError, AdminLoading, InboxHero, Ri, STATUS_LABEL, StatusBadge } from './ui';

const TYPE_ICON: Record<string, string> = {
  BOOK: 'book-2-line',
  AUDIOBOOK: 'headphone-line',
  AUDIOBIOGRAPHY: 'user-voice-line',
  AUDIOSUMMARY: 'file-music-line',
  GALLERY: 'gallery-line',
};

/** Estadísticas agregadas (sin datos personales) frente a metas de capacidad. */
export function Dashboard({ token, onOpenResources, onOpenChallenges, onOpenCuentos }: { token: string; onOpenResources?: () => void; onOpenChallenges?: () => void; onOpenCuentos?: () => void }) {
  const [stats, setStats] = useState<NormalizedStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [tts, setTts] = useState<TtsStatus | null | undefined>(undefined);

  // Estado de la narración sintética (Piper en el servidor, ADR-017): una línea informativa, sin bloquear el resto.
  useEffect(() => {
    let alive = true;
    apiFetch<TtsStatus>(API_ROUTES.adminTtsStatus, { token })
      .then((st) => { if (alive) setTts(st); })
      .catch(() => { if (alive) setTts(null); });
    return () => { alive = false; };
  }, [token, nonce]);

  useEffect(() => {
    let alive = true;
    setError(null);
    setStats(null);
    (async () => {
      let raw: unknown = null;
      let fallback: ResourceDTO[] | null = null;
      try {
        raw = await apiFetch(API_ROUTES.adminStats, { token });
      } catch {
        raw = null;
      }
      try {
        if (!raw || typeof raw !== 'object' || !('byType' in (raw as object))) {
          fallback = normalizeList<ResourceDTO>(await apiFetch(`${API_ROUTES.adminResources}?pageSize=100`, { token }));
        }
        const s = normalizeStats(raw, fallback);
        if (!alive) return;
        if (!s) setError('No hay estadísticas disponibles.');
        else setStats(s);
      } catch (e) {
        if (alive) setError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, nonce]);

  const totalTarget = stats ? Object.values(stats.targets).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Colección frente a metas de capacidad"
        subtitle="Las metas son de capacidad (570 recursos y 100 retos lectores, fijadas el 31/10/2026), no contenidos adquiridos. Datos agregados, sin información personal."
        actions={
          <>
            <button type="button" className="btn btn-pqr-report" onClick={() => setNonce((n) => n + 1)} disabled={!stats && !error}>
              <Ri name="refresh-line" className="me-1" />
              Actualizar
            </button>
            {onOpenResources && (
              <button type="button" className="btn btn-pqr" onClick={onOpenResources}>
                <Ri name="book-2-line" className="me-1" />
                Gestionar recursos
              </button>
            )}
          </>
        }
      />

      {error && <AdminError title="No se pudieron cargar las estadísticas" message={error} onRetry={() => setNonce((n) => n + 1)} />}
      {!error && !stats && <AdminLoading label="Cargando estadísticas…" />}

      {stats && (
        <>
          <section className="pqr-priority-summary pqr-priority-compact madm-kpis" aria-label="Recursos por tipo frente a la meta">
            {RESOURCE_TYPES.map((t) => {
              const n = stats.activeByType[t] ?? 0; // sin retirados
              const target = stats.targets[t] ?? 0;
              const pct = target ? Math.min(100, Math.round((n / target) * 100)) : 0;
              const pub = stats.publishedByType?.[t];
              return (
                <div key={t} className={`pqr-priority-stat madm-static ${pct >= 100 ? 'success' : 'info'}`}>
                  <Ri name={TYPE_ICON[t] ?? 'file-list-3-line'} />
                  <span className="madm-min0 flex-grow-1">
                    <strong>{n}<em className="madm-kpi-target"> / {target}</em></strong>
                    <span>{RESOURCE_TYPE_LABELS[t]}</span>
                    <small>{pct}% de la meta{pub != null ? ` · ${pub} publicados` : ''}</small>
                    <span className="madm-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${RESOURCE_TYPE_LABELS[t]}: ${pct}% de la meta`}>
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                </div>
              );
            })}
            {(() => {
              const c = stats.challenges;
              const target = c?.target ?? CHALLENGE_TARGET;
              const n = c?.active ?? 0;
              const pct = target ? Math.min(100, Math.round((n / target) * 100)) : 0;
              return (
                <div className={`pqr-priority-stat madm-static ${pct >= 100 ? 'success' : 'info'}`} data-testid="kpi-retos">
                  <Ri name="trophy-line" />
                  <span className="madm-min0 flex-grow-1">
                    <strong>{n}<em className="madm-kpi-target"> / {target}</em></strong>
                    <span>Retos lectores</span>
                    <small>{pct}% de la meta{c ? ` · ${c.total} importados` : ' · sin datos de la API'}</small>
                    <span className="madm-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Retos lectores: ${pct}% de la meta`}>
                      <span style={{ width: `${pct}%` }} />
                    </span>
                    {onOpenChallenges && (
                      <button type="button" className="btn btn-link btn-sm p-0 madm-kpi-link" onClick={onOpenChallenges}>
                        Gestionar retos <Ri name="arrow-right-s-line" />
                      </button>
                    )}
                  </span>
                </div>
              );
            })()}
            {stats.cuentos && (
              <div className={`pqr-priority-stat madm-static ${stats.cuentos.pendientes > 0 ? 'warning' : 'success'}`} data-testid="kpi-cuentos">
                <Ri name="quill-pen-line" />
                <span className="madm-min0 flex-grow-1">
                  <strong>{stats.cuentos.pendientes}</strong>
                  <span>Cuentos por revisar</span>
                  <small>{stats.cuentos.aprobados} aprobados · {stats.cuentos.rechazados} rechazados · {stats.cuentos.total} en total</small>
                  {onOpenCuentos && (
                    <button type="button" className="btn btn-link btn-sm p-0 madm-kpi-link" onClick={onOpenCuentos}>
                      Revisar cuentos <Ri name="arrow-right-s-line" />
                    </button>
                  )}
                </span>
              </div>
            )}
            <div className="pqr-priority-stat madm-static secondary">
              <Ri name="stack-line" />
              <span className="madm-min0 flex-grow-1">
                <strong>{stats.activeTotal}<em className="madm-kpi-target"> / {totalTarget}</em></strong>
                <span>En colección</span>
                <small>{totalTarget ? Math.round((stats.activeTotal / totalTarget) * 100) : 0}% de la capacidad · sin {stats.byStatus.RETIRED} retirados</small>
              </span>
            </div>
          </section>

          {tts !== undefined && (
            <p className="pqr-help mb-3" data-testid="tts-status" aria-live="polite">
              <Ri name={tts?.ok ? 'mic-line' : 'mic-off-line'} className="me-1" />
              {ttsStatusLabel(tts)}{tts && !tts.ok && tts.detail ? ` (${tts.detail})` : ''}
            </p>
          )}

          <div className="row g-3">
            <div className="col-lg-6">
              <section className="card pqr-card madm-panel" aria-labelledby="dash-estado">
                <div className="madm-panel-head">
                  <h2 id="dash-estado"><Ri name="pie-chart-line" />Recursos por estado</h2>
                </div>
                <table className="table pqr-table madm-table mb-0">
                  <caption className="visually-hidden">Cantidad de recursos en cada estado</caption>
                  <thead><tr><th scope="col">Estado</th><th scope="col" className="text-end">Recursos</th></tr></thead>
                  <tbody>
                    {(Object.keys(STATUS_LABEL) as ResourceStatus[]).map((s) => (
                      <tr key={s}>
                        <th scope="row" className="fw-normal"><StatusBadge status={s} /></th>
                        <td className="text-end madm-num">{stats.byStatus[s] ?? 0}</td>
                      </tr>
                    ))}
                    {stats.withoutFile != null && (
                      <tr><th scope="row" className="fw-normal">Sin archivo cargado</th><td className="text-end madm-num">{stats.withoutFile}</td></tr>
                    )}
                    {stats.inactiveLicenses != null && (
                      <tr><th scope="row" className="fw-normal">Publicados con licencia no vigente</th><td className="text-end madm-num">{stats.inactiveLicenses}</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
            </div>
            <div className="col-lg-6">
              <section className="card pqr-card madm-panel" aria-labelledby="dash-grado">
                <div className="madm-panel-head">
                  <h2 id="dash-grado"><Ri name="graduation-cap-line" />Recursos por grado</h2>
                  <small>{stats.gradeBasis === 'published' ? 'Recursos publicados aptos para cada grado' : 'Recursos aptos para cada grado (todos los estados)'}</small>
                </div>
                <ul className="madm-grades">
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                    <li key={g}>
                      <span>{g}.º</span>
                      <strong className="madm-num">{stats.byGrade[g] ?? 0}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
