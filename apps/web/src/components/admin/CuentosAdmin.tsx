'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_ROUTES, CUENTO_OPCIONES, CUENTO_STATUS_LABELS, CUENTO_STATUSES, type CuentoAdminDTO, type CuentoStatus } from '@macondo/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { normalizeList } from '@/lib/adminData';
import { useApi } from '../useApi';
import { AdminEmpty, AdminError, AdminLoading, AdminNotice, Badge, InboxHero, Ri, type Notice } from './ui';

const STATUS_TONE: Record<CuentoStatus, 'info' | 'warning' | 'success' | 'danger' | 'secondary'> = {
  GENERATING: 'info', GENERATED: 'info', PENDING_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger', FAILED: 'secondary',
};

function fecha(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

/** Taller de cuentos: cola de revisión de la bibliotecaria (PQR como las otras pestañas). */
export function CuentosAdmin({ token }: { token: string }) {
  const [status, setStatus] = useState<CuentoStatus | ''>('PENDING_REVIEW');
  const path = status ? `${API_ROUTES.adminCuentos}?status=${status}` : API_ROUTES.adminCuentos;
  const { data, error, loading, reload } = useApi<unknown>(path, token);
  const rows = useMemo(() => normalizeList<CuentoAdminDTO>(data), [data]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<Notice | null>(null);
  const open = rows.find((r) => r.id === openId) ?? null;

  if (open) {
    return (
      <Detalle
        token={token}
        cuento={open}
        onBack={() => setOpenId(null)}
        onDone={(n) => { setMsg(n); setOpenId(null); reload(); }}
      />
    );
  }

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Taller de cuentos"
        subtitle="Cuentos escritos por estudiantes con el asistente. Nada se publica sin revisión: al aprobar se crean un libro (EPUB) y, si hay audio, un audiolibro en el catálogo. Los datos del dispositivo nunca se guardan."
        actions={
          <button type="button" className="btn btn-pqr-report" onClick={reload} disabled={loading}>
            <Ri name="refresh-line" className="me-1" />Actualizar
          </button>
        }
      />
      <AdminNotice notice={msg} onClose={() => setMsg(null)} />
      <section className="card pqr-card pqr-inbox-card" aria-label="Listado de cuentos">
        <div className="pqr-filters madm-filters" role="group" aria-label="Filtrar cuentos">
          <div className="row g-2 align-items-end">
            <div className="col-sm-4">
              <label htmlFor="cue-status">Estado</label>
              <select id="cue-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value as CuentoStatus | '')}>
                <option value="">Todos los estados</option>
                {CUENTO_STATUSES.map((s) => <option key={s} value={s}>{CUENTO_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div id="pqrResults" aria-busy={loading}>
          {loading && <AdminLoading label="Cargando cuentos…" />}
          {error && <div className="p-3"><AdminError message={error.message} onRetry={reload} /></div>}
          {!loading && !error && rows.length === 0 && (
            <AdminEmpty title={status === 'PENDING_REVIEW' ? 'No hay cuentos pendientes de revisión' : 'No hay cuentos con ese estado'} icon="quill-pen-line">
              Los cuentos llegan aquí cuando un estudiante termina el asistente en <code>/construye-tu-cuento</code>.
            </AdminEmpty>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="table-responsive">
              <table className="table pqr-inbox-table align-middle mb-0">
                <caption className="visually-hidden">Cuentos del taller</caption>
                <thead>
                  <tr>
                    <th scope="col">Cuento</th>
                    <th scope="col">Banda</th>
                    <th scope="col">Modo</th>
                    <th scope="col">Audio</th>
                    <th scope="col">Ilustración</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha</th>
                    <th scope="col"><span className="visually-hidden">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong className="d-block">{c.titulo || '(sin título)'}</strong>
                        <small className="text-muted">Autor: {c.autorNombre ?? 'anónimo'} · Protagonista: {c.protagonista} · {CUENTO_OPCIONES.lugares[c.lugar]?.titulo}</small>
                      </td>
                      <td>{c.banda}</td>
                      <td>{c.modo === 'ia' ? 'IA' : 'Plantilla'}</td>
                      <td>{c.audio.listo ? 'Sí' : 'No'}</td>
                      <td>{c.imagenAdmin?.existe ? (c.imagenAdmin.oculta ? 'Oculta' : 'Sí') : 'No'}</td>
                      <td><Badge tone={STATUS_TONE[c.status]}>{CUENTO_STATUS_LABELS[c.status]}</Badge></td>
                      <td><small>{fecha(c.createdAt)}</small></td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setOpenId(c.id)}>
                          <Ri name="eye-line" className="me-1" />{c.status === 'PENDING_REVIEW' ? 'Revisar' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Vista previa de la ilustración con el token (la ruta del panel sirve también las ocultas). */
function IlustracionAdmin({ token, id, version }: { token: string; id: string; version: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    fetch(API_ROUTES.adminCuentoImagen(id), { headers: { authorization: `Bearer ${token}` } })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); url = URL.createObjectURL(await r.blob()); if (alive) setSrc(url); })
      .catch(() => { if (alive) setFallo(true); });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [token, id, version]);
  if (fallo) return <p className="text-muted mb-0">No se pudo cargar la ilustración.</p>;
  if (!src) return <p className="text-muted mb-0">Cargando ilustración…</p>;
  return <img src={src} alt="Ilustración del cuento generada con IA" className="img-fluid rounded" style={{ maxHeight: 360 }} data-testid="admin-cuento-ilustracion" />;
}

function Detalle({ token, cuento: inicial, onBack, onDone }: { token: string; cuento: CuentoAdminDTO; onBack: () => void; onDone: (n: Notice) => void }) {
  const [c, setC] = useState(inicial);
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState<'APROBAR' | 'RECHAZAR' | 'IMAGEN' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const pendiente = c.status === 'PENDING_REVIEW';
  const im = c.imagenAdmin;
  const alternarImagen = async () => {
    if (!im?.existe) return;
    setBusy('IMAGEN');
    setErr(null);
    try {
      const r = await apiFetch<CuentoAdminDTO>(API_ROUTES.adminCuentoImagen(c.id), { method: 'POST', token, body: { oculta: !im.oculta } });
      setC(r);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  const decidir = async (decision: 'APROBAR' | 'RECHAZAR') => {
    const msg = decision === 'APROBAR'
      ? `¿Aprobar «${c.titulo}»? Se crearán ${c.audio.listo ? 'un libro y un audiolibro' : 'un libro'} publicados en el catálogo.`
      : `¿Rechazar «${c.titulo}»? No se publicará nada; el cuento queda guardado como rechazado.`;
    if (!window.confirm(msg)) return;
    setBusy(decision);
    setErr(null);
    try {
      const r = await apiFetch<CuentoAdminDTO>(API_ROUTES.adminCuentoRevisar(c.id), { method: 'POST', token, body: { decision, ...(nota.trim() ? { nota: nota.trim() } : {}) } });
      onDone({ tone: decision === 'APROBAR' ? 'success' : 'info', text: decision === 'APROBAR' ? `«${c.titulo}» aprobado: ${r.resourceIds.length} recurso(s) publicados en el catálogo.` : `«${c.titulo}» rechazado.` });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  const k = c.contenido;
  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title={c.titulo || '(sin título)'}
        subtitle={`Autor: ${c.autorNombre ?? 'anónimo'} · Protagonista: ${c.protagonista} (${CUENTO_OPCIONES.tipos[c.tipo]?.titulo}) · ${CUENTO_OPCIONES.lugares[c.lugar]?.titulo} · ${CUENTO_OPCIONES.valores[c.valor]?.titulo} · Banda ${c.banda} · ${c.modo === 'ia' ? 'Escrito con IA' : 'Plantilla'}${c.proveedor?.ms != null ? ` (${c.proveedor.ms} ms, ${c.proveedor.tokensEntrada ?? '?'}/${c.proveedor.tokensSalida ?? '?'} tokens)` : ''}`}
        actions={<button type="button" className="btn btn-light" onClick={onBack}><Ri name="arrow-left-line" className="me-1" />Volver a la lista</button>}
      />
      {err && <AdminError title="No se pudo registrar la decisión" message={err} />}
      <div className="row g-3">
        <div className="col-lg-8">
          <section className="card pqr-card madm-panel" aria-labelledby="cue-texto">
            <div className="madm-panel-head"><h2 id="cue-texto"><Ri name="file-text-line" />Texto del cuento</h2><small><Badge tone={STATUS_TONE[c.status]}>{CUENTO_STATUS_LABELS[c.status]}</Badge></small></div>
            <div className="card-body">
              {c.audio.listo && c.audio.url && (
                <p><audio controls preload="none" src={`${c.audio.url}`} className="w-100" data-testid="admin-cuento-audio" /></p>
              )}
              {!k && <p className="text-muted">Sin contenido (el cuento falló o aún se está escribiendo).</p>}
              {k && (
                <>
                  <p className="fst-italic text-muted">{k.sinopsis}</p>
                  {k.parrafos.map((p, i) => <p key={i} style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{p}</p>)}
                  <p className="fw-semibold">{k.valorRecordatorio}</p>
                  <h3 className="h6 mt-3">Preguntas</h3>
                  <ol>
                    {k.preguntas.map((q, i) => (
                      <li key={i}>{q.pregunta}<ul>{q.opciones.map((o, j) => <li key={j} className={j === q.respuesta ? 'fw-semibold' : ''}>{o}{j === q.respuesta ? ' ✓' : ''}</li>)}</ul></li>
                    ))}
                  </ol>
                  <h3 className="h6 mt-3">Glosario</h3>
                  <ul>{k.glosario.map((g) => <li key={g.palabra}><b>{g.palabra}</b>: {g.significado}</li>)}</ul>
                </>
              )}
            </div>
          </section>
        </div>
        <div className="col-lg-4">
          <section className="card pqr-card madm-panel" aria-labelledby="cue-decision">
            <div className="madm-panel-head"><h2 id="cue-decision"><Ri name="shield-check-line" />Revisión</h2></div>
            <div className="card-body">
              {pendiente ? (
                <>
                  <label htmlFor="cue-nota">Nota (opcional, queda en la auditoría)</label>
                  <textarea id="cue-nota" className="form-control mb-3" rows={3} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} />
                  <div className="d-grid gap-2">
                    <button type="button" className="btn btn-pqr" disabled={busy != null} onClick={() => decidir('APROBAR')}>
                      {busy === 'APROBAR' ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Publicando…</> : <><Ri name="check-line" className="me-1" />Aprobar y publicar</>}
                    </button>
                    <button type="button" className="btn btn-outline-danger" disabled={busy != null} onClick={() => decidir('RECHAZAR')}>
                      <Ri name="close-line" className="me-1" />Rechazar
                    </button>
                  </div>
                  <p className="pqr-help mt-2">Aprobar crea un libro EPUB con portada{c.audio.listo ? ' y un audiolibro' : ''}, publicados para la banda {c.banda}, con la licencia del Taller de cuentos.{im?.existe && !im.oculta ? ' La ilustración será la portada.' : ''}</p>
                </>
              ) : (
                <dl className="mb-0">
                  <dt>Decisión</dt><dd>{CUENTO_STATUS_LABELS[c.status]}{c.reviewedAt ? ` · ${fecha(c.reviewedAt)}` : ''}</dd>
                  {c.reviewNote && <><dt>Nota</dt><dd>{c.reviewNote}</dd></>}
                  {c.resourceIds.length > 0 && <><dt>Recursos creados</dt><dd>{c.resourceIds.map((id) => <code key={id} className="d-block">{id}</code>)}</dd></>}
                  {c.status === 'GENERATING' && <dd className="text-muted">El cuento todavía se está escribiendo; actualiza en un momento.</dd>}
                </dl>
              )}
              {!pendiente && (c.status === 'FAILED' || c.status === 'GENERATED') && (
                <button type="button" className="btn btn-outline-danger mt-2" disabled={busy != null} onClick={() => decidir('RECHAZAR')}><Ri name="close-line" className="me-1" />Rechazar</button>
              )}
            </div>
          </section>
          <section className="card pqr-card madm-panel mt-3" aria-labelledby="cue-imagen">
            <div className="madm-panel-head"><h2 id="cue-imagen"><Ri name="image-line" />Ilustración</h2>{im?.existe && <small><Badge tone={im.oculta ? 'secondary' : 'success'}>{im.oculta ? 'Oculta' : 'Visible'}</Badge></small>}</div>
            <div className="card-body">
              {im?.existe ? (
                <>
                  <IlustracionAdmin token={token} id={c.id} version={im.oculta ? 1 : 0} />
                  <p className="pqr-help mt-2">Generada con IA ({im.proveedor ?? 'proveedor'}{im.ms != null ? `, ${im.ms} ms` : ''}) a partir de las opciones cerradas; el niño ya la vio en la tablet. Si no conviene, ocúltala: deja de mostrarse y no será la portada.</p>
                  {c.status !== 'APPROVED' && c.status !== 'REJECTED' && (
                    <button type="button" className={`btn ${im.oculta ? 'btn-outline-primary' : 'btn-outline-danger'}`} disabled={busy != null} onClick={alternarImagen}>
                      <Ri name={im.oculta ? 'eye-line' : 'eye-off-line'} className="me-1" />{im.oculta ? 'Mostrar ilustración' : 'Ocultar ilustración'}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">{c.imagen?.pendiente ? 'Se está dibujando…' : `Sin ilustración${im?.error ? ` (${im.error})` : ''}. Se usará la portada tipográfica.`}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
