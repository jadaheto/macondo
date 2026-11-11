'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { API_ROUTES, RESOURCE_TYPES, RESOURCE_TYPE_LABELS, ResourceInputSchema, TTS_VOICE_CREDIT, type ResourceDTO, type ResourceType, type TtsStatus } from '@macondo/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { dateInputToIso, formatBytes, isoToDateInput } from '@/lib/adminData';
import { canNarrate, formatDuration, narrationText, ttsStatusLabel } from '@/lib/narration';
import { AdminNotice, Ri, StatusBadge, type Notice } from './ui';
import { UploadZone } from './UploadZone';

interface FormState {
  title: string; creator: string; type: ResourceType; description: string;
  gradeMin: string; gradeMax: string; categories: string; language: string; narrator: string; durationSeconds: string;
  rightsHolder: string; licenseName: string; licenseUrl: string; authorizedDevices: string; offlineAllowed: boolean;
  validFrom: string; validUntil: string; territory: string;
}

function initial(r: ResourceDTO | null): FormState {
  return {
    title: r?.title ?? '', creator: r?.creator ?? '', type: r?.type ?? 'BOOK', description: r?.description ?? '',
    gradeMin: String(r?.gradeMin ?? 1), gradeMax: String(r?.gradeMax ?? 11), categories: r?.categories.join(', ') ?? '',
    language: r?.language ?? 'es', narrator: r?.narrator ?? '', durationSeconds: r?.durationSeconds != null ? String(r.durationSeconds) : '',
    rightsHolder: r?.license.rightsHolder ?? '', licenseName: r?.license.licenseName ?? '', licenseUrl: r?.license.licenseUrl ?? '',
    authorizedDevices: String(r?.license.authorizedDevices ?? 30), offlineAllowed: r?.license.offlineAllowed ?? false,
    validFrom: isoToDateInput(r?.license.validFrom), validUntil: isoToDateInput(r?.license.validUntil), territory: r?.license.territory ?? 'CO',
  };
}

/** Construye el objeto candidato a partir del formulario (sin validar). */
export function formToInput(f: FormState) {
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s));
  return {
    title: f.title.trim(),
    creator: f.creator.trim(),
    type: f.type,
    description: f.description,
    gradeMin: num(f.gradeMin),
    gradeMax: num(f.gradeMax),
    categories: f.categories.split(',').map((c) => c.trim()).filter(Boolean),
    language: f.language.trim() || 'es',
    narrator: f.narrator.trim() || null,
    durationSeconds: f.durationSeconds.trim() ? num(f.durationSeconds) : null,
    license: {
      rightsHolder: f.rightsHolder.trim(),
      licenseName: f.licenseName.trim(),
      licenseUrl: f.licenseUrl.trim() || null,
      authorizedDevices: num(f.authorizedDevices),
      offlineAllowed: f.offlineAllowed,
      validFrom: dateInputToIso(f.validFrom),
      validUntil: dateInputToIso(f.validUntil, true),
      territory: f.territory.trim() || 'CO',
    },
  };
}

const FIELD_MESSAGES: Record<string, string> = {
  title: 'El título es obligatorio (máx. 300 caracteres).',
  creator: 'El autor o creador es obligatorio.',
  gradeMin: 'Grado mínimo entre 1.º y 11.º, y no mayor que el máximo.',
  gradeMax: 'Grado máximo entre 1.º y 11.º.',
  categories: 'Máximo 20 categorías de hasta 60 caracteres cada una.',
  durationSeconds: 'La duración debe ser un número entero de segundos.',
  'license.rightsHolder': 'Indica el titular de los derechos.',
  'license.licenseName': 'Indica la licencia (p. ej. «Dominio público», «CC BY 4.0», «Contrato #123»).',
  'license.licenseUrl': 'La URL de la licencia no es válida (debe empezar por https://).',
  'license.authorizedDevices': 'Número de dispositivos autorizados (0 a 10000).',
};

/** Mapa campo → id del control, en orden visual (para enfocar el primer error). */
const FIELD_IDS: [string, string][] = [
  ['title', 'f-title'], ['creator', 'f-creator'], ['type', 'f-type'], ['language', 'f-lang'], ['description', 'f-desc'],
  ['categories', 'f-cats'], ['narrator', 'f-narr'], ['durationSeconds', 'f-dur'],
  ['gradeMin', 'f-gmin'], ['gradeMax', 'f-gmax'],
  ['license.rightsHolder', 'f-holder'], ['license.licenseName', 'f-lic'], ['license.licenseUrl', 'f-licurl'],
  ['license.authorizedDevices', 'f-dev'], ['license.territory', 'f-terr'], ['license.validFrom', 'f-from'], ['license.validUntil', 'f-until'],
];

const SECTIONS = [
  { id: 'rf-ident', n: '01', title: 'Identificación', hint: 'Título, autor y tipo' },
  { id: 'rf-grades', n: '02', title: 'Grados', hint: 'Rango 1.º a 11.º' },
  { id: 'rf-license', n: '03', title: 'Licencia', hint: 'Derechos del contenido' },
  { id: 'rf-files', n: '04', title: 'Archivos', hint: 'Recurso y portada' },
];

export function ResourceForm({ token, resource, onDone }: { token: string; resource: ResourceDTO | null; onDone: (saved: ResourceDTO | null) => void }) {
  const [f, setF] = useState<FormState>(() => initial(resource));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<ResourceDTO | null>(resource);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [focusNonce, setFocusNonce] = useState(0);
  const [tts, setTts] = useState<TtsStatus | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [narrationNotice, setNarrationNotice] = useState<Notice | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const heroRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heroRef.current?.focus();
  }, []);

  // Estado del motor de narración (solo se consulta si el recurso puede narrarse).
  const narrable = canNarrate(saved);
  useEffect(() => {
    if (!narrable) return;
    let alive = true;
    apiFetch<TtsStatus>(API_ROUTES.adminTtsStatus, { token })
      .then((st) => { if (alive) setTts(st); })
      .catch(() => { if (alive) setTts(null); });
    return () => { alive = false; };
  }, [narrable, token]);

  /** Regrabar con la voz de la biblioteca: el servidor sintetiza `extra.text`, reemplaza el MP3 y acredita la voz. */
  const narrate = async () => {
    if (!saved) return;
    const text = narrationText(saved);
    if (!text) {
      setNarrationNotice({ tone: 'warning', text: 'Este recurso no tiene texto para narrar. Añade el texto (campo «text» de los extras) y guarda antes de regrabar.' });
      return;
    }
    const msg = saved.hasFile
      ? 'Se generará una nueva narración con la voz de la biblioteca y REEMPLAZARÁ el archivo de audio actual. ¿Continuar?'
      : 'Se generará la narración con la voz de la biblioteca a partir del texto del recurso. ¿Continuar?';
    if (!window.confirm(msg)) return;
    setNarrating(true);
    setNarrationNotice({ tone: 'info', text: `Generando la narración (${text.length.toLocaleString('es-CO')} caracteres)… Puede tardar hasta un par de minutos; no cierres esta página.` });
    try {
      const res = await apiFetch<ResourceDTO>(API_ROUTES.adminResourceNarrate(saved.id), { method: 'POST', body: {}, token, timeoutMs: 15 * 60 * 1000 });
      setSaved(res);
      // Lo que cambió el servidor pasa al formulario para que «Guardar cambios» no lo sobrescriba.
      setF((s) => ({ ...s, narrator: res.narrator ?? s.narrator, durationSeconds: res.durationSeconds != null ? String(res.durationSeconds) : s.durationSeconds, licenseName: res.license.licenseName }));
      setNarrationNotice({
        tone: 'success',
        text: `Narración generada: MP3 de ${formatBytes(res.fileSizeBytes ?? 0)}${res.durationSeconds != null ? ` · ${formatDuration(res.durationSeconds)}` : ''}. Narrador: «${TTS_VOICE_CREDIT}».`,
      });
    } catch (err) {
      setNarrationNotice({ tone: 'danger', text: `No se pudo generar la narración. ${errorMessage(err)}` });
    } finally {
      setNarrating(false);
    }
  };

  // Tras un envío con errores: foco al primer control inválido (en orden visual).
  useEffect(() => {
    if (!focusNonce) return;
    const first = FIELD_IDS.find(([k]) => errors[k]);
    const el = first ? document.getElementById(first[1]) : null;
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, [focusNonce, errors]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K], errKey?: string) => {
    setF((s) => ({ ...s, [k]: v }));
    setDirty(true);
    const ek = errKey ?? String(k);
    if (errors[ek]) setErrors(({ [ek]: _drop, ...rest }) => rest);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const candidate = formToInput(f);
    const parsed = ResourceInputSchema.safeParse(candidate);
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.').replace(/\.\d+$/, '');
        errs[key] ??= FIELD_MESSAGES[key] ?? issue.message;
      }
    }
    if (f.validFrom && f.validUntil && f.validFrom > f.validUntil) errs['license.validUntil'] = 'La fecha final debe ser posterior a la inicial.';
    if (Object.keys(errs).length > 0 || !parsed.success) {
      setErrors(errs);
      const n = Object.keys(errs).length;
      setNotice({ tone: 'danger', text: `Revisa ${n === 1 ? 'el campo marcado' : `los ${n} campos marcados`}. Tus datos se conservaron.` });
      setFocusNonce((x) => x + 1);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = saved
        ? await apiFetch<ResourceDTO>(API_ROUTES.adminResource(saved.id), { method: 'PATCH', body: parsed.data, token })
        : await apiFetch<ResourceDTO>(API_ROUTES.adminResources, { method: 'POST', body: parsed.data, token });
      const wasNew = !saved;
      setSaved(res ?? saved);
      setDirty(false);
      setNotice({
        tone: 'success',
        text: wasNew
          ? 'Recurso creado como borrador. Ya puedes cargar el archivo y la portada en «Archivos».'
          : 'Cambios guardados.',
      });
      if (wasNew) setTimeout(() => document.getElementById('rf-files')?.scrollIntoView({ block: 'start' }), 50);
    } catch (err) {
      setNotice({ tone: 'danger', text: `No se pudo guardar. ${errorMessage(err)} Tus datos se conservaron.` });
    } finally {
      setSaving(false);
    }
  };

  const back = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Salir de todas formas?')) return;
    onDone(saved && saved !== resource ? saved : null);
  };

  const cls = (k: string, base = 'form-control') => `${base}${errors[k] ? ' is-invalid' : ''}`;
  const aria = (k: string, help?: string) => ({
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': [errors[k] ? `err-${k}` : null, help].filter(Boolean).join(' ') || undefined,
  });
  const err = (k: string) => (errors[k] ? <div id={`err-${k}`} className="invalid-feedback">{errors[k]}</div> : null);

  const heading = resource ? `Editar recurso` : saved ? 'Recurso creado' : 'Nuevo recurso';
  const grades = Array.from({ length: 11 }, (_, i) => i + 1);

  return (
    <div className="container-fluid pqr-shell pqr-create-internal">
      <div className="pqr-hero pqr-create-hero mb-2">
        <div className="pqr-create-hero-content">
          <div className="madm-min0">
            <span className="pqr-kicker">Colección · {saved ? 'borrador guardado' : 'registro nuevo'}</span>
            <h3 ref={heroRef} tabIndex={-1} className="madm-focus-target">{heading}{saved ? `: ${saved.title}` : ''}</h3>
            <p>Los campos con <span aria-hidden="true">*</span><span className="visually-hidden">asterisco</span> son obligatorios. El recurso se crea como borrador; publícalo desde el listado.</p>
          </div>
          <button type="button" className="pqr-create-back" onClick={back}>
            <Ri name="arrow-left-line" /> Volver al listado
          </button>
        </div>
      </div>

      <nav className="pqr-create-nav" aria-label="Secciones del formulario">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`pqr-create-jump${activeSection === s.id ? ' is-active' : ''}`}
            aria-current={activeSection === s.id ? 'location' : undefined}
            onClick={() => setActiveSection(s.id)}
          >
            <span className="pqr-create-step-number">{s.n}</span>
            <span className="pqr-create-step-copy"><strong>{s.title}</strong><small>{s.hint}</small></span>
          </a>
        ))}
      </nav>

      <form id="pqrCreate" ref={formRef} onSubmit={submit} noValidate aria-describedby="rf-required-note">
        <p id="rf-required-note" className="visually-hidden">Los campos marcados con asterisco son obligatorios.</p>

        <Section id="rf-ident" className="pqr-create-applicant" icon="book-2-line" title="Identificación" hint="Cómo se reconoce el recurso en el catálogo.">
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="f-title" className="required">Título</label>
              <input id="f-title" className={cls('title')} value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={300} required {...aria('title')} />
              {err('title')}
            </div>
            <div className="col-md-6">
              <label htmlFor="f-creator" className="required">Autor / creador</label>
              <input id="f-creator" className={cls('creator')} value={f.creator} onChange={(e) => set('creator', e.target.value)} maxLength={200} required {...aria('creator')} />
              {err('creator')}
            </div>
            <div className="col-md-6">
              <label htmlFor="f-type" className="required">Tipo de recurso</label>
              <select id="f-type" className={cls('type', 'form-select')} value={f.type} onChange={(e) => set('type', e.target.value as ResourceType)} required>
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label htmlFor="f-desc">Descripción</label>
              <textarea id="f-desc" className="form-control" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={5000} aria-describedby="f-desc-count" />
              <small id="f-desc-count" className="pqr-description-count d-block text-end">{f.description.length} / 5000</small>
            </div>
            <div className="col-md-6">
              <label htmlFor="f-cats">Categorías</label>
              <input id="f-cats" className={cls('categories')} value={f.categories} onChange={(e) => set('categories', e.target.value)} {...aria('categories', 'f-cats-help')} />
              {err('categories') ?? <small id="f-cats-help" className="pqr-help">Separadas por coma, p. ej.: fábulas, poesía.</small>}
            </div>
            <div className="col-md-6">
              <label htmlFor="f-lang">Idioma</label>
              <input id="f-lang" className="form-control" value={f.language} onChange={(e) => set('language', e.target.value)} maxLength={10} aria-describedby="f-lang-help" />
              <small id="f-lang-help" className="pqr-help">Código ISO: es, en…</small>
            </div>
            <div className="col-md-6">
              <label htmlFor="f-narr">Narrador</label>
              <input id="f-narr" className="form-control" value={f.narrator} onChange={(e) => set('narrator', e.target.value)} maxLength={200} aria-describedby="f-narr-help" />
              <small id="f-narr-help" className="pqr-help">Solo para audiolibros, audiobiografías y audioresúmenes.</small>
            </div>
            <div className="col-md-6">
              <label htmlFor="f-dur">Duración (segundos)</label>
              <input id="f-dur" type="number" inputMode="numeric" min={0} className={cls('durationSeconds')} value={f.durationSeconds} onChange={(e) => set('durationSeconds', e.target.value)} {...aria('durationSeconds', 'f-dur-help')} />
              {err('durationSeconds') ?? <small id="f-dur-help" className="pqr-help">Opcional. Ej.: 1800 = 30 minutos.</small>}
            </div>
          </div>
        </Section>

        <Section id="rf-grades" className="pqr-create-reception" icon="graduation-cap-line" title="Clasificación por grado" hint="Grados escolares para los que el recurso es apto.">
          <div className="row g-3">
            <div className="col-6">
              <label htmlFor="f-gmin" className="required">Grado desde</label>
              <select id="f-gmin" className={cls('gradeMin', 'form-select')} value={f.gradeMin} onChange={(e) => set('gradeMin', e.target.value)} required {...aria('gradeMin')}>
                {grades.map((g) => <option key={g} value={g}>{g}.º</option>)}
              </select>
            </div>
            <div className="col-6">
              <label htmlFor="f-gmax" className="required">Grado hasta</label>
              <select id="f-gmax" className={cls('gradeMax', 'form-select')} value={f.gradeMax} onChange={(e) => set('gradeMax', e.target.value, 'gradeMin')} required {...aria('gradeMax')}>
                {grades.map((g) => <option key={g} value={g}>{g}.º</option>)}
              </select>
            </div>
            <div className="col-12">
              {err('gradeMin')}
              {err('gradeMax')}
              <small className="pqr-help mt-0">El catálogo muestra el recurso a estudiantes de estos grados. «Grado desde» no puede ser mayor que «Grado hasta».</small>
            </div>
          </div>
          {saved && (
            <div className="madm-status-box">
              <span>Estado actual</span>
              <StatusBadge status={saved.status} />
            </div>
          )}
        </Section>

        <Section id="rf-license" className="madm-wide" icon="shield-keyhole-line" title="Licencia y derechos" hint="La licencia del software no equivale a la licencia de los contenidos: registra la autorización específica de este recurso.">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="f-holder" className="required">Titular de derechos</label>
              <input id="f-holder" className={cls('license.rightsHolder')} value={f.rightsHolder} onChange={(e) => set('rightsHolder', e.target.value, 'license.rightsHolder')} maxLength={200} required {...aria('license.rightsHolder')} />
              {err('license.rightsHolder')}
            </div>
            <div className="col-md-6">
              <label htmlFor="f-lic" className="required">Licencia</label>
              <input id="f-lic" className={cls('license.licenseName')} value={f.licenseName} onChange={(e) => set('licenseName', e.target.value, 'license.licenseName')} maxLength={200} required {...aria('license.licenseName', 'f-lic-help')} />
              {err('license.licenseName') ?? <small id="f-lic-help" className="pqr-help">Ej.: Dominio público, CC BY 4.0, Contrato #123.</small>}
            </div>
            <div className="col-md-8">
              <label htmlFor="f-licurl">URL de la licencia</label>
              <div className="input-group pqr-icon-field">
                <span className="input-group-text"><Ri name="links-line" /></span>
                <input id="f-licurl" type="url" inputMode="url" placeholder="https://" className={cls('license.licenseUrl')} value={f.licenseUrl} onChange={(e) => set('licenseUrl', e.target.value, 'license.licenseUrl')} maxLength={500} {...aria('license.licenseUrl')} />
              </div>
              {err('license.licenseUrl')}
            </div>
            <div className="col-md-4">
              <label htmlFor="f-dev" className="required">Dispositivos autorizados</label>
              <input id="f-dev" type="number" inputMode="numeric" min={0} max={10000} className={cls('license.authorizedDevices')} value={f.authorizedDevices} onChange={(e) => set('authorizedDevices', e.target.value, 'license.authorizedDevices')} required {...aria('license.authorizedDevices')} />
              {err('license.authorizedDevices')}
            </div>
            <div className="col-md-4">
              <label htmlFor="f-terr">Territorio</label>
              <input id="f-terr" className="form-control" value={f.territory} onChange={(e) => set('territory', e.target.value)} maxLength={100} />
            </div>
            <div className="col-md-4 col-6">
              <label htmlFor="f-from">Vigente desde</label>
              <input id="f-from" type="date" className="form-control" value={f.validFrom} onChange={(e) => set('validFrom', e.target.value, 'license.validUntil')} />
            </div>
            <div className="col-md-4 col-6">
              <label htmlFor="f-until">Vigente hasta</label>
              <input id="f-until" type="date" className={cls('license.validUntil')} value={f.validUntil} onChange={(e) => set('validUntil', e.target.value, 'license.validUntil')} {...aria('license.validUntil', 'f-until-help')} />
              {err('license.validUntil') ?? <small id="f-until-help" className="pqr-help">Vacío = sin vencimiento declarado.</small>}
            </div>
            <div className="col-12">
              <div className="pqr-consent-panel madm-consent">
                <div className="form-check">
                  <input id="f-offline" type="checkbox" className="form-check-input" checked={f.offlineAllowed} onChange={(e) => set('offlineAllowed', e.target.checked)} />
                  <label htmlFor="f-offline" className="form-check-label">La licencia permite descarga para uso sin conexión</label>
                </div>
                <p className="pqr-consent-note"><Ri name="information-fill" /><span>Márcalo solo si el contrato o la licencia lo autorizan expresamente.</span></p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="rf-files" className="madm-wide" icon="attachment-2" title="Archivos" hint="Archivo del recurso y portada. El servidor valida el contenido real, no solo la extensión.">
          {!saved ? (
            <div className="madm-alert info madm-disabled-box" aria-live="polite">
              <Ri name="lock-line" />
              <p>Guarda primero el recurso como borrador para habilitar la carga de archivos.</p>
            </div>
          ) : (
            <div className="row g-3">
              <div className="col-xl-6">
                <UploadZone
                  key={saved.type === 'GALLERY' ? 'gallery' : 'file'}
                  token={token}
                  kind={saved.type === 'GALLERY' ? 'gallery' : 'file'}
                  label={saved.type === 'GALLERY' ? 'Galería (ZIP)' : 'Archivo del recurso'}
                  accept={saved.type === 'GALLERY' ? '.zip,application/zip,application/x-zip-compressed' : '.epub,.pdf,.mp3,application/epub+zip,application/pdf,audio/mpeg'}
                  url={API_ROUTES.adminResourceFile(saved.id)}
                  current={saved.hasFile ? `Actual: ${saved.format === 'IMAGE_SET' ? 'galería (ZIP)' : saved.format}${saved.fileSizeBytes ? ` · ${formatBytes(saved.fileSizeBytes)}` : ''}` : 'Sin archivo cargado'}
                  onUploaded={(r) => { if (r) setSaved(r); }}
                />
              </div>
              <div className="col-xl-6">
                <UploadZone
                  token={token}
                  kind="cover"
                  label="Portada"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  url={API_ROUTES.adminResourceCover(saved.id)}
                  current={saved.hasCover ? 'Tiene portada cargada' : 'Sin portada'}
                  onUploaded={(r) => { if (r) setSaved(r); }}
                />
              </div>
              {narrable && (
                <div className="col-12">
                  <div className="pqr-consent-panel madm-consent" data-testid="narration-panel">
                    <h6 className="mb-1"><Ri name="mic-line" className="me-1" />Narración con la voz de la biblioteca</h6>
                    <p className="pqr-consent-note mb-2">
                      <Ri name="information-fill" />
                      <span>
                        Genera el MP3 en el servidor a partir del texto del recurso ({narrationText(saved) ? `${narrationText(saved).length.toLocaleString('es-CO')} caracteres` : 'sin texto todavía'}) y reemplaza el archivo de audio actual.
                        {' '}El narrador quedará como «{TTS_VOICE_CREDIT}». <span data-testid="tts-status">{ttsStatusLabel(tts)}</span>{tts && !tts.ok && tts.detail ? ` (${tts.detail})` : ''}.
                      </span>
                    </p>
                    <button
                      type="button"
                      className="btn btn-pqr-report"
                      onClick={narrate}
                      disabled={narrating || !narrationText(saved) || (tts !== null && !tts.ok)}
                      aria-busy={narrating || undefined}
                    >
                      {narrating
                        ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Generando narración…</>
                        : <><Ri name="mic-line" className="me-1" />Regrabar con la voz de la biblioteca</>}
                    </button>
                    <div className="mt-2" aria-live="polite">
                      <AdminNotice notice={narrationNotice} onClose={narrating ? undefined : () => setNarrationNotice(null)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        <AdminNotice notice={notice} />

        <div className="pqr-create-actions d-flex flex-column flex-sm-row justify-content-end align-items-center gap-2">
          <small className="pqr-create-review-hint">{dirty ? 'Hay cambios sin guardar.' : saved ? 'Sin cambios pendientes.' : 'Se guardará como borrador.'}</small>
          <button type="button" className="btn btn-light" onClick={back}>Volver a la lista</button>
          <button type="submit" className="btn btn-pqr" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Guardando…</>
              : <><Ri name="save-3-line" className="me-1" />{saved ? 'Guardar cambios' : 'Crear recurso (borrador)'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ id, className, icon, title, hint, children }: { id: string; className: string; icon: string; title: string; hint: string; children: ReactNode }) {
  return (
    <section id={id} className={`pqr-form-section ${className}`} aria-labelledby={`${id}-h`}>
      <h5 className="pqr-create-section-heading" id={`${id}-h`}>
        <Ri name={icon} />
        <span><strong>{title}</strong><small>{hint}</small></span>
      </h5>
      {children}
    </section>
  );
}
