'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  API_ROUTES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  type ResourceDTO,
  type ResourceStatus,
  type ResourceType,
} from '@macondo/shared';
import { ApiError, apiFetch, errorMessage } from '@/lib/api';
import { fetchAllPages, formatBytes, runSequential } from '@/lib/adminData';
import { gradeRangeLabel } from '@/lib/resource';
import { AdminEmpty, AdminError, AdminLoading, AdminNotice, Badge, InboxHero, Ri, STATUS_LABEL, StatusBadge, type Notice } from './ui';
import { ResourceForm } from './ResourceForm';

const PAGE_SIZE = 20;
const SHORTCUT_LABEL: Record<ResourceStatus, string> = { PUBLISHED: 'Publicados', DRAFT: 'Borradores', RETIRED: 'Retirados' };

/**
 * Carga TODOS los recursos (la API limita pageSize a 100 y la colección tiene 570+). Antes solo se
 * pedía la primera página: la búsqueda y los conteos del panel ignoraban el resto de la colección.
 */
function useAllResources(token: string) {
  const [all, setAll] = useState<ResourceDTO[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchAllPages<ResourceDTO>((page, pageSize) => apiFetch(`${API_ROUTES.adminResources}?page=${page}&pageSize=${pageSize}`, { token, signal: ctrl.signal }))
      .then((rows) => { if (!ctrl.signal.aborted) setAll(rows); })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(e instanceof ApiError ? e : new ApiError('network', 'Ocurrió un error inesperado.'));
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [token, nonce]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { all, error, loading, reload };
}

export function ResourcesAdmin({ token }: { token: string }) {
  const { all, error, loading, reload } = useAllResources(token);
  const [editing, setEditing] = useState<ResourceDTO | 'new' | null>(null);
  const [status, setStatus] = useState<ResourceStatus | ''>('');
  const [type, setType] = useState<ResourceType | ''>('');
  const [grade, setGrade] = useState('');
  const [q, setQ] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const returnFocus = useRef<string | null>(null);
  // Acciones en lote: selección por id (sobrevive a filtros y paginación) y avance de la ejecución secuencial.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulk, setBulk] = useState<{ running: boolean; done: number; total: number; label: string; errors: { title: string; message: string }[] } | null>(null);

  const base = useMemo(() => {
    const term = q.trim().toLowerCase();
    const g = grade ? Number(grade) : null;
    return all.filter(
      (r) =>
        (!type || r.type === type) &&
        (g == null || (r.gradeMin <= g && r.gradeMax >= g)) &&
        (!term || `${r.title} ${r.creator} ${r.categories.join(' ')}`.toLowerCase().includes(term)),
    );
  }, [all, q, type, grade]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { '': base.length };
    for (const s of RESOURCE_STATUSES) c[s] = base.filter((r) => r.status === s).length;
    return c;
  }, [base]);
  const rows = status ? base.filter((r) => r.status === status) : base;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const activeFilters = (type ? 1 : 0) + (grade ? 1 : 0);

  useEffect(() => setPage(1), [q, type, grade, status]);

  // Al volver del formulario, devolver el foco a la acción que lo abrió.
  useEffect(() => {
    if (!editing && returnFocus.current && !loading) {
      const el = document.getElementById(returnFocus.current);
      el?.focus();
      returnFocus.current = null;
    }
  }, [editing, loading]);

  const changeStatus = async (r: ResourceDTO, next: ResourceStatus) => {
    if (next === 'RETIRED' && !window.confirm(`¿Retirar «${r.title}»? Dejará de mostrarse a estudiantes (no se borra).`)) return;
    setBusyId(r.id);
    setMsg(null);
    try {
      if (next === 'RETIRED') await apiFetch(API_ROUTES.adminResource(r.id), { method: 'DELETE', token });
      else await apiFetch(API_ROUTES.adminResourceStatus(r.id), { method: 'POST', body: { status: next }, token });
      setMsg({ tone: 'success', text: `«${r.title}» ahora está: ${STATUS_LABEL[next]}.` });
      reload();
    } catch (e) {
      setMsg({ tone: 'danger', text: `No se pudo cambiar el estado de «${r.title}». ${errorMessage(e)}` });
    } finally {
      setBusyId(null);
    }
  };

  // ── Acciones en lote ──────────────────────────────────────────────────────────
  const visibleIds = visible.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleVisible = () =>
    setSelected((s) => {
      const n = new Set(s);
      for (const id of visibleIds) if (allVisibleSelected) n.delete(id); else n.add(id);
      return n;
    });

  /**
   * Publica o retira los seleccionados UNO A UNO (cada llamada queda auditada en el servidor),
   * con confirmación previa, línea de avance y lista de errores. Los que fallan quedan seleccionados
   * para poder reintentar.
   */
  const runBulk = async (next: 'PUBLISHED' | 'RETIRED') => {
    const targets = all.filter((r) => selected.has(r.id) && r.status !== next);
    if (targets.length === 0) {
      setMsg({ tone: 'info', text: `Los recursos seleccionados ya están en estado ${STATUS_LABEL[next]}.` });
      return;
    }
    const verb = next === 'PUBLISHED' ? 'Publicar' : 'Retirar';
    const question = next === 'RETIRED'
      ? `¿Retirar ${targets.length} recurso(s)? Dejarán de mostrarse a estudiantes (no se borran).`
      : `¿Publicar ${targets.length} recurso(s)? Quedarán visibles para estudiantes si su licencia está vigente.`;
    if (!window.confirm(question)) return;
    setMsg(null);
    setBulk({ running: true, done: 0, total: targets.length, label: verb, errors: [] });
    const res = await runSequential(
      targets,
      (r) => (next === 'RETIRED'
        ? apiFetch(API_ROUTES.adminResource(r.id), { method: 'DELETE', token })
        : apiFetch(API_ROUTES.adminResourceStatus(r.id), { method: 'POST', body: { status: next }, token })),
      (done, total) => setBulk((b) => (b ? { ...b, done, total } : b)),
      errorMessage,
    );
    setBulk({ running: false, done: res.done, total: targets.length, label: verb, errors: res.errors.map((e) => ({ title: e.item.title, message: e.message })) });
    setSelected(new Set(res.errors.map((e) => e.item.id)));
    setMsg(res.errors.length
      ? { tone: 'warning', text: `${res.done} de ${targets.length} recursos pasaron a ${STATUS_LABEL[next]}; ${res.errors.length} con error (ver lista).` }
      : { tone: 'success', text: `${res.done} recurso(s) ahora en estado: ${STATUS_LABEL[next]}.` });
    reload();
  };

  const clearFilters = () => {
    setType('');
    setGrade('');
    setQ('');
    setStatus('');
  };

  if (editing) {
    return (
      <ResourceForm
        token={token}
        resource={editing === 'new' ? null : editing}
        onDone={(saved) => {
          setEditing(null);
          if (saved) setMsg({ tone: 'success', text: `Se guardó «${saved.title}».` });
          reload();
        }}
      />
    );
  }

  const open = (r: ResourceDTO | 'new', focusId: string) => {
    returnFocus.current = focusId;
    setMsg(null);
    setEditing(r);
  };

  const actions = (r: ResourceDTO, prefix: string) => {
    const busy = busyId === r.id;
    return (
      <>
        <button type="button" id={`${prefix}-edit-${r.id}`} className="btn btn-outline-primary" onClick={() => open(r, `${prefix}-edit-${r.id}`)} aria-label={`Editar ${r.title}`}>
          <Ri name="edit-line" className="me-1" />Editar
        </button>
        {r.status !== 'PUBLISHED' && (
          <button type="button" className="btn btn-pqr" disabled={busy} onClick={() => changeStatus(r, 'PUBLISHED')} aria-label={`Publicar ${r.title}`}>
            <Ri name="send-plane-line" className="me-1" />Publicar
          </button>
        )}
        {r.status === 'PUBLISHED' && (
          <button type="button" className="btn btn-light" disabled={busy} onClick={() => changeStatus(r, 'DRAFT')} aria-label={`Pasar a borrador ${r.title}`}>
            <Ri name="draft-line" className="me-1" />A borrador
          </button>
        )}
        {r.status !== 'RETIRED' && (
          <button type="button" className="btn madm-btn-danger" disabled={busy} onClick={() => changeStatus(r, 'RETIRED')} aria-label={`Retirar ${r.title}`}>
            <Ri name="archive-line" className="me-1" />Retirar
          </button>
        )}
      </>
    );
  };

  const fileInfo = (r: ResourceDTO) =>
    r.hasFile ? (
      <span className="madm-meta"><Ri name="file-line" />{r.format}{r.fileSizeBytes ? ` · ${formatBytes(r.fileSizeBytes)}` : ''}{r.hasCover ? ' · portada' : ''}</span>
    ) : (
      <Badge tone="warning" icon="file-warning-line">Sin archivo</Badge>
    );

  const licenseInfo = (r: ResourceDTO) => (
    <>
      <span className="madm-meta madm-ellipsis" title={r.license.licenseName}>{r.license.licenseName}</span>
      {r.status === 'PUBLISHED' && !r.accessible && <Badge tone="warning" icon="alert-line">No accesible</Badge>}
    </>
  );

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Recursos de la colección"
        subtitle="Libros, audiolibros y galerías en todos los estados. Retirar no borra: oculta el recurso a estudiantes."
        actions={
          <button type="button" id="res-new" className="btn btn-pqr" onClick={() => open('new', 'res-new')}>
            <Ri name="add-line" className="me-1" />Nuevo recurso
          </button>
        }
      />

      <AdminNotice notice={msg} onClose={() => setMsg(null)} />

      <section className="card pqr-card pqr-inbox-card" aria-label="Listado de recursos">
        <div className="pqr-inbox-toolbar">
          <div className="pqr-inbox-search">
            <Ri name="search-line" />
            <label className="visually-hidden" htmlFor="adm-q">Buscar recurso</label>
            <input id="adm-q" className="form-control" type="search" placeholder="Título, autor o categoría" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="pqr-inbox-shortcuts" role="group" aria-label="Filtrar por estado">
            {(['', ...RESOURCE_STATUSES] as const).map((s) => (
              <button key={s || 'all'} type="button" className={`pqr-shortcut${status === s ? ' active' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s ? SHORTCUT_LABEL[s] : 'Todos'} <span>{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-pqr-filter" aria-expanded={filtersOpen} aria-controls="adm-filters" onClick={() => setFiltersOpen((o) => !o)}>
            <Ri name="filter-3-line" /> Filtros{activeFilters ? ` (${activeFilters})` : ''}
          </button>
        </div>

        <div id="adm-filters" className="pqr-filters madm-filters" hidden={!filtersOpen}>
          <div className="row g-2 align-items-end">
            <div className="col-sm-6 col-lg-4">
              <label htmlFor="adm-type">Tipo</label>
              <select id="adm-type" className="form-select" value={type} onChange={(e) => setType(e.target.value as ResourceType | '')}>
                <option value="">Todos los tipos</option>
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="col-sm-6 col-lg-4">
              <label htmlFor="adm-grade">Grado</label>
              <select id="adm-grade" className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Todos los grados</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>{g}.º</option>)}
              </select>
            </div>
            <div className="col-lg-4">
              <label htmlFor="adm-status">Estado</label>
              <select id="adm-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value as ResourceStatus | '')}>
                <option value="">Todos los estados</option>
                {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {(activeFilters > 0 || q || status) && (
          <p className="pqr-inbox-filter-caption madm-caption">
            <Ri name="filter-line" />
            <span>
              {[
                q && `Búsqueda: «${q}»`,
                status && `Estado: ${STATUS_LABEL[status]}`,
                type && `Tipo: ${RESOURCE_TYPE_LABELS[type]}`,
                grade && `Grado: ${grade}.º`,
              ].filter(Boolean).join(' · ')}
            </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={clearFilters}>Quitar filtros</button>
          </p>
        )}

        {(selected.size > 0 || bulk) && (
          <div className="madm-bulk" role="region" aria-label="Acciones en lote" data-testid="bulk-bar">
            <strong>{selected.size} seleccionado{selected.size === 1 ? '' : 's'}</strong>
            <button type="button" className="btn btn-pqr" disabled={!!bulk?.running || selected.size === 0} onClick={() => runBulk('PUBLISHED')}>
              <Ri name="send-plane-line" className="me-1" />Publicar seleccionados
            </button>
            <button type="button" className="btn madm-btn-danger" disabled={!!bulk?.running || selected.size === 0} onClick={() => runBulk('RETIRED')}>
              <Ri name="archive-line" className="me-1" />Retirar seleccionados
            </button>
            <button type="button" className="btn btn-light" disabled={!!bulk?.running} onClick={() => { setSelected(new Set()); setBulk(null); }}>
              <Ri name="close-line" className="me-1" />Quitar selección
            </button>
            {bulk && (
              <p className="madm-bulk-progress" role="status" aria-live="polite">
                {bulk.running
                  ? `${bulk.label}: procesando ${Math.min(bulk.done + 1, bulk.total)} de ${bulk.total}…`
                  : `${bulk.label}: ${bulk.done} de ${bulk.total} completados${bulk.errors.length ? `, ${bulk.errors.length} con error` : ''}.`}
              </p>
            )}
            {bulk && bulk.errors.length > 0 && (
              <ul className="madm-bulk-errors" aria-label="Recursos con error">
                {bulk.errors.map((e, i) => <li key={i}><strong>{e.title}</strong>: {e.message}</li>)}
              </ul>
            )}
          </div>
        )}

        <div id="pqrResults" aria-busy={loading}>
          {loading && <AdminLoading label="Cargando recursos…" />}
          {error && <div className="p-3"><AdminError message={error.message} onRetry={reload} /></div>}
          {!loading && !error && all.length === 0 && (
            <AdminEmpty title="Aún no hay recursos" icon="book-open-line">Crea el primero con «Nuevo recurso».</AdminEmpty>
          )}
          {!loading && !error && all.length > 0 && rows.length === 0 && (
            <AdminEmpty title="No hay recursos con estos filtros" icon="search-line">
              <button type="button" className="btn btn-link" onClick={clearFilters}>Quitar filtros</button>
            </AdminEmpty>
          )}
          {!loading && !error && visible.length > 0 && (
            <>
              <div className="pqr-desktop-list table-responsive">
                <table className="table pqr-inbox-table madm-t-res align-middle mb-0">
                  <caption className="visually-hidden">Recursos de la colección en todos los estados</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="madm-select-col">
                        <input type="checkbox" className="form-check-input madm-check" aria-label="Seleccionar los recursos de esta página" checked={allVisibleSelected} onChange={toggleVisible} disabled={!!bulk?.running} />
                      </th>
                      <th scope="col">Recurso</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Grados</th>
                      <th scope="col">Archivo</th>
                      <th scope="col">Licencia</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id} aria-busy={busyId === r.id} aria-selected={selected.has(r.id) || undefined}>
                        <td className="madm-select-col">
                          <input type="checkbox" className="form-check-input madm-check" aria-label={`Seleccionar ${r.title}`} checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} disabled={!!bulk?.running} />
                        </td>
                        <td className="madm-col-title">
                          <strong className="pqr-inbox-subject pqr-clamp-2">{r.title}</strong>
                          <span className="pqr-inbox-person-name">{r.creator}</span>
                        </td>
                        <td>{RESOURCE_TYPE_LABELS[r.type]}</td>
                        <td className="text-nowrap">{gradeRangeLabel(r.gradeMin, r.gradeMax)}</td>
                        <td>{fileInfo(r)}</td>
                        <td className="madm-col-license">{licenseInfo(r)}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="pqr-inbox-action"><div className="madm-row-actions">{actions(r, 'd')}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pqr-mobile-list">
                {visible.map((r) => (
                  <article key={r.id} className={`pqr-mobile-card madm-card-${r.status.toLowerCase()}`} aria-busy={busyId === r.id}>
                    <label className="madm-card-select">
                      <input type="checkbox" className="form-check-input madm-check" aria-label={`Seleccionar ${r.title}`} checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} disabled={!!bulk?.running} />
                      Seleccionar
                    </label>
                    <div className="pqr-mobile-top">
                      <div className="madm-min0">
                        <strong className="pqr-radicado madm-card-title">{r.title}</strong>
                        <small className="d-block text-muted">{r.creator}</small>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="pqr-mobile-facts">
                      <span><b>Tipo</b>{RESOURCE_TYPE_LABELS[r.type]}</span>
                      <span><b>Grados</b>{gradeRangeLabel(r.gradeMin, r.gradeMax)}</span>
                      <span><b>Archivo</b>{fileInfo(r)}</span>
                      <span><b>Licencia</b>{licenseInfo(r)}</span>
                    </div>
                    <div className="pqr-mobile-footer madm-row-actions">{actions(r, 'm')}</div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
        {!loading && !error && all.length > 0 && (
          <nav className="pqr-pagination pqr-inbox-pagination" aria-label="Paginación de recursos">
            <button type="button" className="btn btn-light" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <Ri name="arrow-left-s-line" /> Anterior
            </button>
            <span aria-live="polite">
              {rows.length === 0 ? 'Sin resultados' : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, rows.length)} de ${rows.length} recursos`}
              {rows.length !== all.length ? ` (de ${all.length} en total)` : ''}
            </span>
            <button type="button" className="btn btn-light" disabled={current >= pages} onClick={() => setPage(current + 1)}>
              Siguiente <Ri name="arrow-right-s-line" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
