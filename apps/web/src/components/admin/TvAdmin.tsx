'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { API_ROUTES, TV_BLOCK_LABELS, TV_KIND_BLOCK, TvSlideInputSchema, TvSlideKindSchema, type ResourceDTO, type TvSlideDTO, type TvSlideKind } from '@macondo/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { datetimeLocalToIso, isoToDatetimeLocal, normalizeList } from '@/lib/adminData';
import { useApi } from '../useApi';
import { AdminEmpty, AdminError, AdminLoading, AdminNotice, Badge, formatDateTime, InboxHero, Ri, type Notice } from './ui';

const KIND_LABEL: Record<TvSlideKind, string> = {
  BOOK_OF_WEEK: 'Libro de la semana',
  FEATURED_AUTHOR: 'Autor destacado',
  FUN_FACT: 'Dato curioso',
  GALLERY: 'Galería',
  AGENDA: 'Agenda',
  CHALLENGE: 'Reto colectivo',
  MESSAGE: 'Mensaje institucional',
  TUTORIAL: 'Tutorial (kiosco y tablets)',
};

/** Ayuda de formato del texto según el bloque de la pantalla. */
const BODY_HINT: Partial<Record<TvSlideKind, string>> = {
  AGENDA: 'Una actividad por línea, con el formato «Actividad – cuándo».',
  MESSAGE: 'Una actividad o aviso por línea.',
  TUTORIAL: 'Un paso por línea (3 a 6 pasos).',
  CHALLENGE: 'Línea 1: la frase. Línea 2: «— Autor, obra». Siguientes: invitación a los retos.',
  BOOK_OF_WEEK: 'Sinopsis breve (si se deja vacío se usa la descripción del recurso).',
  FEATURED_AUTHOR: 'Biografía breve y verificada; enlaza una obra publicada para mostrar portada y QR.',
};

interface SlideForm {
  kind: TvSlideKind; title: string; body: string; resourceId: string; order: string; durationSeconds: string;
  startsAt: string; endsAt: string; active: boolean;
}
const empty: SlideForm = { kind: 'BOOK_OF_WEEK', title: '', body: '', resourceId: '', order: '0', durationSeconds: '20', startsAt: '', endsAt: '', active: true };
const resourceLabel = (s: TvSlideDTO) => (s.resource ? `${s.resource.title} — ${s.resource.creator}` : '');
const fromDto = (s: TvSlideDTO): SlideForm => ({
  kind: s.kind, title: s.title, body: s.body ?? '', resourceId: s.resourceId ?? '', order: String(s.order ?? 0),
  durationSeconds: String(s.durationSeconds ?? 20), startsAt: isoToDatetimeLocal(s.startsAt), endsAt: isoToDatetimeLocal(s.endsAt), active: s.active !== false,
});

const FIELD_ORDER: [string, string][] = [['title', 's-title'], ['order', 's-order'], ['durationSeconds', 's-dur'], ['endsAt', 's-end']];

export function TvAdmin({ token }: { token: string }) {
  const { data, error, loading, reload } = useApi<unknown>(API_ROUTES.adminTvSlides, token);
  const slides = useMemo(() => normalizeList<TvSlideDTO>(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [data]);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<SlideForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [resLabel, setResLabel] = useState('');
  const formHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (editingId) formHeading.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (!focusNonce) return;
    const first = FIELD_ORDER.find(([k]) => errors[k]);
    if (first) document.getElementById(first[1])?.focus();
  }, [focusNonce, errors]);

  const set = <K extends keyof SlideForm>(k: K, v: SlideForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors(({ [k as string]: _drop, ...rest }) => rest);
  };

  const openForm = (id: string | 'new', values: SlideForm, label = '') => {
    setForm(values);
    setResLabel(label);
    setErrors({});
    setMsg(null);
    setEditingId(id);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const candidate = {
      kind: form.kind,
      title: form.title.trim(),
      body: form.body,
      resourceId: form.resourceId.trim() || null,
      order: Number(form.order),
      durationSeconds: Number(form.durationSeconds),
      startsAt: datetimeLocalToIso(form.startsAt),
      endsAt: datetimeLocalToIso(form.endsAt),
      active: form.active,
    };
    const parsed = TvSlideInputSchema.safeParse(candidate);
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        const k = String(i.path[0] ?? '');
        errs[k] ??= k === 'title' ? 'El título es obligatorio.' : k === 'durationSeconds' ? 'La duración debe estar entre 3 y 600 segundos.' : k === 'order' ? 'El orden debe ser un entero mayor o igual a 0.' : i.message;
      }
    }
    if (candidate.startsAt && candidate.endsAt && candidate.startsAt > candidate.endsAt) errs.endsAt = 'La fecha de fin debe ser posterior al inicio.';
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.success) {
      setFocusNonce((n) => n + 1);
      return;
    }
    setBusy(true);
    try {
      if (editingId === 'new') await apiFetch(API_ROUTES.adminTvSlides, { method: 'POST', body: parsed.data, token });
      else if (editingId) await apiFetch(API_ROUTES.adminTvSlide(editingId), { method: 'PATCH', body: parsed.data, token });
      setMsg({ tone: 'success', text: `Diapositiva «${candidate.title}» guardada.` });
      setEditingId(null);
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: `No se pudo guardar. ${errorMessage(err)} Tus datos se conservaron.` });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: TvSlideDTO) => {
    if (!window.confirm(`¿Eliminar la diapositiva «${s.title}»?`)) return;
    setBusyId(s.id);
    try {
      await apiFetch(API_ROUTES.adminTvSlide(s.id), { method: 'DELETE', token });
      setMsg({ tone: 'success', text: `Diapositiva «${s.title}» eliminada.` });
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const cls = (k: string, base = 'form-control') => `${base}${errors[k] ? ' is-invalid' : ''}`;
  const aria = (k: string, help?: string) => ({
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': [errors[k] ? `serr-${k}` : null, help].filter(Boolean).join(' ') || undefined,
  });
  const err = (k: string) => (errors[k] ? <div id={`serr-${k}`} className="invalid-feedback d-block">{errors[k]}</div> : null);

  const vigencia = (s: TvSlideDTO) => `${s.startsAt ? formatDateTime(s.startsAt) : 'Siempre'} → ${s.endsAt ? formatDateTime(s.endsAt) : 'sin fin'}`;
  const actions = (s: TvSlideDTO) => (
    <>
      <button type="button" className="btn btn-outline-primary" onClick={() => openForm(s.id, fromDto(s), resourceLabel(s))} aria-label={`Editar ${s.title}`}>
        <Ri name="edit-line" className="me-1" />Editar
      </button>
      <button type="button" className="btn madm-btn-danger" disabled={busyId === s.id} onClick={() => remove(s)} aria-label={`Eliminar ${s.title}`}>
        <Ri name="delete-bin-line" className="me-1" />Eliminar
      </button>
    </>
  );

  return (
    <div className="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
      <InboxHero
        title="Programación de Macondo TV"
        subtitle="Diapositivas que rotan en la pantalla de la sala. Horarios en hora de Colombia."
        actions={
          <>
            <a href="/tv" target="_blank" rel="noopener" className="btn btn-pqr-report">
              <Ri name="external-link-line" className="me-1" />Ver pantalla TV
            </a>
            <button type="button" className="btn btn-pqr" onClick={() => openForm('new', empty)}>
              <Ri name="add-line" className="me-1" />Nueva diapositiva
            </button>
          </>
        }
      />
      <AdminNotice notice={msg} onClose={() => setMsg(null)} />

      {editingId && (
        <form onSubmit={save} noValidate className="pqr-form-section madm-slide-form" aria-labelledby="slide-form-h">
          <h5 className="madm-section-title" id="slide-form-h" ref={formHeading} tabIndex={-1}>
            <Ri name="slideshow-line" />
            <span><strong>{editingId === 'new' ? 'Nueva diapositiva' : 'Editar diapositiva'}</strong><small>Los campos con * son obligatorios.</small></span>
          </h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="s-kind" className="required">Tipo</label>
              <select id="s-kind" className="form-select" value={form.kind} onChange={(e) => set('kind', e.target.value as TvSlideKind)}>
                {TvSlideKindSchema.options.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
              <small className="pqr-help">Bloque en pantalla: {TV_BLOCK_LABELS[TV_KIND_BLOCK[form.kind]]}</small>
            </div>
            <div className="col-md-8">
              <label htmlFor="s-title" className="required">Título</label>
              <input id="s-title" className={cls('title')} value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} required {...aria('title')} />
              {err('title')}
            </div>
            <div className="col-12">
              <label htmlFor="s-body">Texto</label>
              <textarea id="s-body" className="form-control" rows={3} value={form.body} maxLength={2000} onChange={(e) => set('body', e.target.value)} aria-describedby="s-body-help" />
              <small id="s-body-help" className="pqr-help">Breve y legible a distancia. {BODY_HINT[form.kind] ?? ''} {form.body.length} / 2000</small>
            </div>
            <div className="col-md-6">
              <ResourcePicker
                token={token}
                value={form.resourceId}
                label={resLabel}
                onChange={(id, label) => { set('resourceId', id); setResLabel(label); }}
              />
            </div>
            <div className="col-md-3 col-6">
              <label htmlFor="s-order" className="required">Orden</label>
              <input id="s-order" type="number" inputMode="numeric" min={0} className={cls('order')} value={form.order} onChange={(e) => set('order', e.target.value)} required {...aria('order')} />
              {err('order')}
            </div>
            <div className="col-md-3 col-6">
              <label htmlFor="s-dur" className="required">Duración (s)</label>
              <input id="s-dur" type="number" inputMode="numeric" min={3} max={600} className={cls('durationSeconds')} value={form.durationSeconds} onChange={(e) => set('durationSeconds', e.target.value)} required {...aria('durationSeconds')} />
              {err('durationSeconds')}
            </div>
            <div className="col-md-6">
              <label htmlFor="s-start">Desde (hora Colombia)</label>
              <input id="s-start" type="datetime-local" className="form-control" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="s-end">Hasta (hora Colombia)</label>
              <input id="s-end" type="datetime-local" className={cls('endsAt')} value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} {...aria('endsAt')} />
              {err('endsAt')}
            </div>
            <div className="col-12">
              <div className="form-check">
                <input id="s-active" type="checkbox" className="form-check-input" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
                <label htmlFor="s-active" className="form-check-label">Activa (se muestra en la rotación)</label>
              </div>
            </div>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="madm-alert danger mt-3" role="alert"><Ri name="error-warning-line" /><p>Revisa los campos marcados. Tus datos se conservaron.</p></div>
          )}
          <div className="madm-form-actions">
            <button type="button" className="btn btn-light" onClick={() => setEditingId(null)}>Cancelar</button>
            <button type="submit" className="btn btn-pqr" disabled={busy}>
              {busy ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Guardando…</> : <><Ri name="save-3-line" className="me-1" />Guardar</>}
            </button>
          </div>
        </form>
      )}

      <section className="card pqr-card pqr-inbox-card" aria-label="Diapositivas programadas">
        <div id="pqrResults" aria-busy={loading}>
          {loading && <AdminLoading label="Cargando diapositivas…" />}
          {error && <div className="p-3"><AdminError message={error.message} onRetry={reload} /></div>}
          {!loading && !error && slides.length === 0 && (
            <AdminEmpty title="No hay diapositivas" icon="slideshow-line">La pantalla mostrará los mensajes institucionales de respaldo.</AdminEmpty>
          )}
          {!loading && !error && slides.length > 0 && (
            <>
              <div className="pqr-desktop-list table-responsive">
                <table className="table pqr-inbox-table madm-t-tv align-middle mb-0">
                  <caption className="visually-hidden">Diapositivas de Macondo TV por orden de rotación</caption>
                  <thead>
                    <tr><th scope="col">Orden</th><th scope="col">Diapositiva</th><th scope="col">Duración</th><th scope="col">Vigencia</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {slides.map((s) => (
                      <tr key={s.id}>
                        <td><span className="pqr-radicado madm-num">#{s.order}</span></td>
                        <td className="madm-col-title">
                          <strong className="pqr-inbox-subject pqr-clamp-2">{s.title}</strong>
                          <span className="pqr-inbox-person-name">{KIND_LABEL[s.kind] ?? s.kind} · {TV_BLOCK_LABELS[TV_KIND_BLOCK[s.kind]] ?? ''}{s.resource ? ` · ${s.resource.title}` : ''}</span>
                        </td>
                        <td className="text-nowrap">{s.durationSeconds} s</td>
                        <td className="madm-small">{vigencia(s)}</td>
                        <td>{s.active ? <Badge tone="success" icon="play-circle-line">Activa</Badge> : <Badge tone="secondary" icon="pause-circle-line">Inactiva</Badge>}</td>
                        <td className="pqr-inbox-action"><div className="madm-row-actions">{actions(s)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pqr-mobile-list">
                {slides.map((s) => (
                  <article key={s.id} className="pqr-mobile-card">
                    <div className="pqr-mobile-top">
                      <div className="madm-min0">
                        <strong className="pqr-radicado madm-card-title">#{s.order} · {s.title}</strong>
                        <small className="d-block text-muted">{KIND_LABEL[s.kind] ?? s.kind}</small>
                      </div>
                      {s.active ? <Badge tone="success" icon="play-circle-line">Activa</Badge> : <Badge tone="secondary" icon="pause-circle-line">Inactiva</Badge>}
                    </div>
                    <div className="pqr-mobile-facts">
                      <span><b>Duración</b>{s.durationSeconds} s</span>
                      <span><b>Vigencia</b>{vigencia(s)}</span>
                    </div>
                    <div className="pqr-mobile-footer madm-row-actions">{actions(s)}</div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/** Selector de recurso: busca en el catálogo administrativo por título/autor y enlaza por id. */
function ResourcePicker({ token, value, label, onChange }: { token: string; value: string; label: string; onChange: (id: string, label: string) => void }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, loading } = useApi<unknown>(debounced.length >= 2 ? `${API_ROUTES.adminResources}?q=${encodeURIComponent(debounced)}&pageSize=8` : null, token);
  const results = normalizeList<ResourceDTO>(data);
  return (
    <div className="madm-res-picker">
      <label htmlFor="s-res">Recurso relacionado</label>
      {value ? (
        <div className="d-flex align-items-center gap-2 flex-wrap" id="s-res-selected">
          <span className="pqr-inbox-subject" data-testid="tv-res-selected">{label || value}</span>
          <button type="button" className="btn btn-light btn-sm" onClick={() => onChange('', '')} aria-label="Quitar recurso relacionado">
            <Ri name="close-line" className="me-1" />Quitar
          </button>
        </div>
      ) : (
        <>
          <input id="s-res" type="search" className="form-control" placeholder="Buscar por título o autor…" value={q} onChange={(e) => setQ(e.target.value)} aria-describedby="s-res-help" autoComplete="off" />
          {debounced.length >= 2 && (
            <ul className="list-group mt-1" aria-label="Resultados de recursos" aria-busy={loading}>
              {loading && <li className="list-group-item text-muted">Buscando…</li>}
              {!loading && results.length === 0 && <li className="list-group-item text-muted">Sin resultados.</li>}
              {results.map((r) => (
                <li key={r.id} className="list-group-item p-0">
                  <button type="button" className="btn btn-link w-100 text-start" onClick={() => { onChange(r.id, `${r.title} — ${r.creator}`); setQ(''); }}>
                    {r.title} <small className="text-muted">— {r.creator} · {r.status === 'PUBLISHED' ? 'publicado' : r.status === 'DRAFT' ? 'borrador' : 'retirado'}{r.hasCover ? ' · con portada' : ''}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <small id="s-res-help" className="pqr-help">Opcional. Muestra la portada autorizada y un QR a su ficha (solo si está publicado).</small>
    </div>
  );
}
