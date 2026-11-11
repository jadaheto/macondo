'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { API_ROUTES, CHALLENGE_KINDS, type ChallengeDTO, type ChallengeImportResult, type ChallengeKind, GRADE_BANDS, type GradeBand } from '@macondo/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { CHALLENGE_KIND_LABELS, filterChallenges, normalizeList, parseChallengeImport } from '@/lib/adminData';
import { useApi } from '../useApi';
import { AdminEmpty, AdminError, AdminLoading, AdminNotice, Badge, InboxHero, Ri, type Notice } from './ui';

const KIND_ICON: Record<ChallengeKind, string> = { trivia: 'question-answer-line', sequence: 'list-ordered', match: 'links-line' };
const KIND_TONE: Record<ChallengeKind, 'info' | 'warning' | 'success'> = { trivia: 'info', sequence: 'warning', match: 'success' };

/** Retos lectores: listado con filtros, activar/desactivar e importación JSON (PQR como las otras pestañas). */
export function ChallengesAdmin({ token }: { token: string }) {
  const { data, error, loading, reload } = useApi<unknown>(API_ROUTES.adminChallenges, token);
  const rows = useMemo(() => normalizeList<ChallengeDTO>(data), [data]);
  const [band, setBand] = useState<GradeBand | ''>('');
  const [kind, setKind] = useState<ChallengeKind | ''>('');
  const [active, setActive] = useState<'' | 'true' | 'false'>('');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<Notice | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  // Estado efectivo: el cambio local se refleja al instante sin esperar la recarga completa.
  const effective = useMemo(() => rows.map((c) => (c.id in overrides ? { ...c, active: overrides[c.id]! } : c)), [rows, overrides]);
  const visible = useMemo(() => filterChallenges(effective, { band, kind, active, q }), [effective, band, kind, active, q]);
  const activeCount = effective.filter((c) => c.active).length;
  const hasFilters = !!(band || kind || active || q.trim());

  const toggle = async (c: ChallengeDTO) => {
    const next = !c.active;
    setBusyId(c.id);
    setMsg(null);
    try {
      const saved = await apiFetch<ChallengeDTO>(API_ROUTES.adminChallengeActive(c.id), { method: 'POST', body: { active: next }, token });
      setOverrides((o) => ({ ...o, [c.id]: saved?.active ?? next }));
      setMsg({ tone: 'success', text: `«${c.title}» ahora está ${next ? 'activo: visible en /retos' : 'inactivo: oculto para estudiantes'}.` });
    } catch (e) {
      setMsg({ tone: 'danger', text: `No se pudo cambiar «${c.title}». ${errorMessage(e)}` });
    } finally {
      setBusyId(null);
    }
  };

  const clear = () => { setBand(''); setKind(''); setActive(''); setQ(''); };

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Retos lectores"
        subtitle={`Trivias, secuencias y parejas por banda de grado. ${activeCount} activos de ${effective.length} importados. Desactivar no borra: el reto deja de mostrarse en /retos.`}
        actions={
          <>
            <button type="button" className="btn btn-pqr-report" onClick={() => { setOverrides({}); reload(); }} disabled={loading}>
              <Ri name="refresh-line" className="me-1" />Actualizar
            </button>
            <button type="button" id="ret-import-toggle" className="btn btn-pqr" aria-expanded={importOpen} aria-controls="ret-import" onClick={() => setImportOpen((o) => !o)}>
              <Ri name="upload-2-line" className="me-1" />Importar JSON
            </button>
          </>
        }
      />

      <AdminNotice notice={msg} onClose={() => setMsg(null)} />

      {importOpen && (
        <ImportBox
          token={token}
          onDone={(r) => {
            setOverrides({});
            reload();
            setMsg({ tone: r.unresolved.length ? 'warning' : 'success', text: importSummary(r) });
          }}
        />
      )}

      <section className="card pqr-card pqr-inbox-card" aria-label="Listado de retos">
        <div className="pqr-inbox-toolbar madm-toolbar-simple">
          <div className="pqr-inbox-search">
            <Ri name="search-line" />
            <label className="visually-hidden" htmlFor="ret-q">Buscar reto</label>
            <input id="ret-q" type="search" className="form-control" placeholder="Título, identificador u obra" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="pqr-filters madm-filters" role="group" aria-label="Filtrar retos">
          <div className="row g-2 align-items-end">
            <div className="col-sm-4">
              <label htmlFor="ret-band">Banda de grados</label>
              <select id="ret-band" className="form-select" value={band} onChange={(e) => setBand(e.target.value as GradeBand | '')}>
                <option value="">Todas las bandas</option>
                {GRADE_BANDS.map((b) => <option key={b} value={b}>{b.replace('-', '.º a ')}.º</option>)}
              </select>
            </div>
            <div className="col-sm-4">
              <label htmlFor="ret-kind">Tipo</label>
              <select id="ret-kind" className="form-select" value={kind} onChange={(e) => setKind(e.target.value as ChallengeKind | '')}>
                <option value="">Todos los tipos</option>
                {CHALLENGE_KINDS.map((k) => <option key={k} value={k}>{CHALLENGE_KIND_LABELS[k]}</option>)}
              </select>
            </div>
            <div className="col-sm-4">
              <label htmlFor="ret-active">Estado</label>
              <select id="ret-active" className="form-select" value={active} onChange={(e) => setActive(e.target.value as '' | 'true' | 'false')}>
                <option value="">Activos e inactivos</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
            </div>
          </div>
        </div>
        {hasFilters && (
          <p className="pqr-inbox-filter-caption madm-caption">
            <Ri name="filter-line" />
            <span>{[q.trim() && `Búsqueda: «${q.trim()}»`, band && `Banda: ${band}`, kind && `Tipo: ${CHALLENGE_KIND_LABELS[kind]}`, active && (active === 'true' ? 'Solo activos' : 'Solo inactivos')].filter(Boolean).join(' · ')}</span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={clear}>Quitar filtros</button>
          </p>
        )}

        <div id="pqrResults" aria-busy={loading}>
          {loading && <AdminLoading label="Cargando retos…" />}
          {error && <div className="p-3"><AdminError message={error.message} onRetry={reload} /></div>}
          {!loading && !error && rows.length === 0 && (
            <AdminEmpty title="Aún no hay retos importados" icon="trophy-line">Usa «Importar JSON» con el archivo <code>retos.json</code>.</AdminEmpty>
          )}
          {!loading && !error && rows.length > 0 && visible.length === 0 && (
            <AdminEmpty title="Ningún reto coincide con los filtros" icon="search-line"><button type="button" className="btn btn-link" onClick={clear}>Quitar filtros</button></AdminEmpty>
          )}
          {!loading && !error && visible.length > 0 && (
            <>
              <div className="pqr-desktop-list table-responsive">
                <table className="table pqr-inbox-table madm-t-ret align-middle mb-0">
                  <caption className="visually-hidden">Retos lectores importados</caption>
                  <thead>
                    <tr>
                      <th scope="col">Reto</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Bandas</th>
                      <th scope="col">Obra enlazada</th>
                      <th scope="col">Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((c) => (
                      <tr key={c.id} aria-busy={busyId === c.id} data-challenge-id={c.id}>
                        <td className="madm-col-title">
                          <strong className="pqr-inbox-subject pqr-clamp-2">{c.title}</strong>
                          <span className="pqr-inbox-person-name madm-small"><code>{c.id}</code>{countLabel(c)}</span>
                        </td>
                        <td><Badge tone={KIND_TONE[c.kind]} icon={KIND_ICON[c.kind]}>{CHALLENGE_KIND_LABELS[c.kind]}</Badge></td>
                        <td className="text-nowrap">{c.bands.join(', ')}</td>
                        <td className="madm-break">{linked(c)}</td>
                        <td><ActiveToggle c={c} busy={busyId === c.id} onToggle={() => toggle(c)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pqr-mobile-list">
                {visible.map((c) => (
                  <article key={c.id} className="pqr-mobile-card" aria-busy={busyId === c.id}>
                    <div className="pqr-mobile-top">
                      <div className="madm-min0">
                        <strong className="pqr-radicado madm-card-title">{c.title}</strong>
                        <small className="d-block text-muted"><code>{c.id}</code></small>
                      </div>
                      <Badge tone={KIND_TONE[c.kind]} icon={KIND_ICON[c.kind]}>{CHALLENGE_KIND_LABELS[c.kind]}</Badge>
                    </div>
                    <div className="pqr-mobile-facts">
                      <span><b>Bandas</b>{c.bands.join(', ')}</span>
                      <span><b>Obra</b>{linked(c)}</span>
                    </div>
                    <div className="pqr-mobile-footer madm-row-actions"><ActiveToggle c={c} busy={busyId === c.id} onToggle={() => toggle(c)} /></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
        {!loading && !error && rows.length > 0 && (
          <div className="pqr-pagination pqr-inbox-pagination"><span aria-live="polite">{visible.length} de {rows.length} retos · {activeCount} activos</span></div>
        )}
      </section>
    </div>
  );
}

function countLabel(c: ChallengeDTO): string {
  if (c.kind === 'trivia') return ` · ${c.questions.length} pregunta${c.questions.length === 1 ? '' : 's'}`;
  if (c.kind === 'sequence') return ` · ${c.steps.length} pasos`;
  return ` · ${c.pairs.length} parejas`;
}

function linked(c: ChallengeDTO) {
  if (!c.resource) return <span className="text-muted">—</span>;
  return <span className="madm-meta" title={`${c.resource.title} — ${c.resource.creator}`}><Ri name="book-2-line" />{c.resource.title} <small className="text-muted">— {c.resource.creator}</small></span>;
}

/** Interruptor accesible: botón con aria-pressed y texto de estado (no solo color). */
function ActiveToggle({ c, busy, onToggle }: { c: ChallengeDTO; busy: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`btn btn-sm ${c.active ? 'btn-pqr' : 'btn-light'} madm-toggle`}
      aria-pressed={c.active}
      aria-label={`${c.active ? 'Desactivar' : 'Activar'} ${c.title}`}
      disabled={busy}
      onClick={onToggle}
    >
      {busy ? <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" /> : <Ri name={c.active ? 'toggle-fill' : 'toggle-line'} className="me-1" />}
      {c.active ? 'Activo' : 'Inactivo'}
    </button>
  );
}

export function importSummary(r: ChallengeImportResult): string {
  const parts = [`${r.total} reto${r.total === 1 ? '' : 's'} procesados`, `${r.created} nuevos`, `${r.updated} actualizados`];
  const tail = r.unresolved.length ? `. ${r.unresolved.length} sin obra enlazada (título/autor no coinciden con ningún recurso): ${r.unresolved.slice(0, 5).join(', ')}${r.unresolved.length > 5 ? '…' : ''}` : '.';
  return `Importación terminada: ${parts.join(', ')}${tail}`;
}

/** Cuadro «Importar JSON»: pegar o cargar retos.json → validar con el contrato → POST al importador. */
function ImportBox({ token, onDone }: { token: string; onDone: (r: ChallengeImportResult) => void }) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ChallengeImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => { setText(t); setProblem(null); setResult(null); }).catch(() => setProblem('No se pudo leer el archivo.'));
  };

  const submit = async () => {
    setProblem(null);
    setResult(null);
    const parsed = parseChallengeImport(text);
    if (!parsed.ok) { setProblem(parsed.message); return; }
    setBusy(true);
    try {
      const r = await apiFetch<ChallengeImportResult>(API_ROUTES.adminChallengesImport, { method: 'POST', body: parsed.items, token, timeoutMs: 120_000 });
      setResult(r);
      onDone(r);
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="ret-import" className="card pqr-card madm-panel mb-3" aria-labelledby="ret-import-title">
      <div className="madm-panel-head">
        <h2 id="ret-import-title"><Ri name="upload-2-line" />Importar retos desde JSON</h2>
        <small>Mismo formato de <code>catalogo-dp/retos/retos.json</code>. La importación es idempotente por <code>id</code>: crea los nuevos, actualiza los existentes y conserva su estado activo.</small>
      </div>
      <div className="card-body">
        <div className="mb-2">
          <label htmlFor="ret-json" className="form-label">Contenido JSON</label>
          <textarea
            id="ret-json"
            className={`form-control madm-json${problem ? ' is-invalid' : ''}`}
            rows={8}
            spellCheck={false}
            value={text}
            onChange={(e) => { setText(e.target.value); setProblem(null); }}
            placeholder='[{"id": "trivia-pombo", "kind": "trivia", "title": "…", "bands": ["1-3"], "questions": [ … ]}]'
            aria-invalid={!!problem || undefined}
            aria-describedby={problem ? 'ret-json-err' : 'ret-json-help'}
          />
          {problem
            ? <div id="ret-json-err" className="invalid-feedback d-block" role="alert">{problem}</div>
            : <small id="ret-json-help" className="pqr-help">Pega el arreglo completo o carga el archivo. Se valida antes de enviarlo.</small>}
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <label htmlFor="ret-file" className="btn btn-light mb-0">
            <Ri name="folder-open-line" className="me-1" />Cargar archivo .json
            <input ref={fileRef} id="ret-file" type="file" accept=".json,application/json" className="visually-hidden" onChange={onFile} />
          </label>
          <button type="button" className="btn btn-pqr" onClick={submit} disabled={busy || !text.trim()}>
            {busy ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Importando…</> : <><Ri name="send-plane-line" className="me-1" />Importar</>}
          </button>
          {text && <button type="button" className="btn btn-link btn-sm" onClick={() => { setText(''); setProblem(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; }}>Limpiar</button>}
        </div>
        {result && (
          <dl className="madm-import-result mt-3" aria-label="Resultado de la importación">
            <div><dt>Procesados</dt><dd>{result.total}</dd></div>
            <div><dt>Nuevos</dt><dd>{result.created}</dd></div>
            <div><dt>Actualizados</dt><dd>{result.updated}</dd></div>
            <div><dt>Sin obra enlazada</dt><dd>{result.unresolved.length}</dd></div>
          </dl>
        )}
      </div>
    </section>
  );
}
