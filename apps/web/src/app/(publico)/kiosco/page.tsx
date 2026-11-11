'use client';

/**
 * Kiosco táctil público (/kiosco). Pensado para el tótem de 32" (vertical 1080×1920 o 1200×1920;
 * también horizontal 1920×1080) y para pantallas menores.
 * - Sesión anónima: sin cuentas. Se limpia por inactividad (por defecto 90 s + aviso de 10 s).
 * - Configurable por dispositivo: localStorage `macondo.kiosk.config` =
 *   {"timeoutSeconds":90,"warningSeconds":10,"scale":1.5}
 *   o por URL: /kiosco?inactividad=120&aviso=10&escala=1.5 (la URL pisa lo guardado y se persiste).
 * - Escala (`escala=1|1.25|1.5|1.75`): CSS `zoom` sobre la raíz del kiosco (la app Android pasa 1.25–1.5
 *   en el tótem). La maquetación se decide con el tamaño efectivo (ventana ÷ escala), ver `kioskLayout`.
 * - Configuración oculta: pulsación larga (3 s) sobre el logotipo de la cabecera → panel «Configuración
 *   del kiosco» (escala, orientación detectada, inactividad). SIN PIN a propósito: el bloqueo del
 *   dispositivo lo hace el sistema (app Android en modo kiosco/lock task o navegador en modo kiosco),
 *   y aquí solo se ajustan preferencias de presentación, no datos.
 * - Los QR solo enlazan a /recurso/[id] de recursos accesibles.
 *
 * IMPORTANTE: impedir que el público salga de la app (botón inicio, gestos, barra del sistema)
 * DEBE configurarse con el modo kiosco / fijación de pantalla del sistema operativo (p. ej. Fire OS
 * o Android "pantalla fija", Chrome --kiosk). JavaScript no puede garantizar esa restricción.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS, type Paginated, type ResourceDTO, type ResourceType } from '@macondo/shared';
import { apiFetch, catalogUrl, errorMessage } from '@/lib/api';
import {
  clearKioskSession, createInactivityTimer, KIOSK_CONFIG_KEY, KIOSK_SCALES, kioskLayout, kioskScaleStyle, parseKioskConfig,
  resolveKioskConfig, toStoredConfig, type KioskConfig, type KioskLayout, type KioskScale,
} from '@/lib/kioskTimer';
import { readJSON, writeJSON } from '@/lib/storage';
import { fileUrl, gradeRangeLabel, typeLabel } from '@/lib/resource';
import { Cover } from '@/components/Cover';
import { Icon, type IconName } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Butterfly } from '@/components/Butterfly';
import { ComfasucreLogo } from '@/components/Wordmark';

const TYPE_ICONS: Record<ResourceType, IconName> = {
  BOOK: 'libro', AUDIOBOOK: 'audifonos', AUDIOBIOGRAPHY: 'persona', AUDIOSUMMARY: 'resumen', GALLERY: 'galeria',
};
/* Clases del perfil kiosco (branding.md §3.4/§5): botón ≥56px radio 12px; panel radio 16px padding 20px. */
const K_BTN = 'inline-flex min-h-kiosk min-w-kiosk items-center justify-center gap-2.5 rounded-control border px-[18px] text-lg font-bold leading-tight transition-colors duration-brand disabled:opacity-[.55]';
const K_PRIMARY = `${K_BTN} border-brand-primary bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover active:bg-brand-primary-hover`;
const K_SECONDARY = `${K_BTN} border-brand-control-border bg-brand-soft text-brand-primary hover:bg-brand-info-bg active:bg-[#d5e9f4]`;
const K_TEXT = `${K_BTN} border-brand-border bg-brand-surface text-brand-muted hover:text-brand-primary`;
const K_PANEL = 'rounded-panel border border-brand-border bg-brand-surface p-5';
const LONG_PRESS_MS = 3000;

type View = { kind: 'home' } | { kind: 'results'; q?: string; type?: ResourceType };

const DEFAULT_LAYOUT = kioskLayout(1920, 1080, 1);

/** Tamaño de ventana + escala → maquetación; se recalcula al girar o redimensionar. */
function useKioskLayout(scale: number): KioskLayout {
  const [layout, setLayout] = useState<KioskLayout>(DEFAULT_LAYOUT);
  useEffect(() => {
    const update = () => setLayout(kioskLayout(window.innerWidth, window.innerHeight, scale));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [scale]);
  return layout;
}

export default function KioskPage() {
  const [sessionKey, setSessionKey] = useState(0);
  const [warning, setWarning] = useState<number | null>(null);
  const [config, setConfig] = useState<KioskConfig>(() => parseKioskConfig(null));
  const [configOpen, setConfigOpen] = useState(false);
  const [supportsZoom, setSupportsZoom] = useState(true);
  const timerRef = useRef<ReturnType<typeof createInactivityTimer> | null>(null);
  const layout = useKioskLayout(config.scale);

  const resetSession = useCallback(() => {
    clearKioskSession();
    setWarning(null);
    setConfigOpen(false);
    setSessionKey((k) => k + 1); // remonta toda la UI del kiosco: vuelve al inicio sin estado
    window.scrollTo({ top: 0 });
  }, []);

  // Configuración inicial: guardada ← URL; lo que trae la URL se persiste para el próximo arranque.
  useEffect(() => {
    const { config: cfg, stored } = resolveKioskConfig(readJSON(KIOSK_CONFIG_KEY, null), window.location.search);
    if (window.location.search) writeJSON(KIOSK_CONFIG_KEY, stored);
    setConfig(cfg);
    setSupportsZoom(typeof CSS !== 'undefined' && typeof CSS.supports === 'function' ? CSS.supports('zoom', '1.5') : true);
  }, []);

  useEffect(() => {
    const timer = createInactivityTimer({
      timeoutMs: config.timeoutMs,
      warningMs: config.warningMs,
      onWarning: (s) => setWarning(s),
      onTick: (s) => setWarning(s),
      onResume: () => setWarning(null),
      onExpire: resetSession,
    });
    timerRef.current = timer;
    timer.start();
    const onActivity = () => timer.activity();
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    return () => {
      timer.stop();
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [resetSession, config.timeoutMs, config.warningMs]);

  const saveConfig = (next: KioskConfig) => {
    setConfig(next);
    writeJSON(KIOSK_CONFIG_KEY, toStoredConfig(next));
  };

  const rootStyle: CSSProperties = {
    ...kioskScaleStyle(config.scale, supportsZoom),
    // Alto efectivo de la ventana: sustituye a 100vh, cuyo valor bajo `zoom` varía según el motor.
    ['--k-vh' as string]: `${layout.height}px`,
  };

  return (
    <div
      data-testid="kiosk-root"
      data-escala={config.scale}
      data-orientacion={layout.orientation}
      className="min-h-[var(--k-vh)]"
      style={rootStyle}
    >
      <KioskSession key={sessionKey} layout={layout} onLongPressLogo={() => setConfigOpen(true)} />
      {configOpen && <KioskConfigPanel config={config} layout={layout} onSave={saveConfig} onClose={() => setConfigOpen(false)} />}
      {warning != null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="kiosk-warn-title" aria-describedby="kiosk-warn-desc" className="fixed inset-0 z-50 flex items-center justify-center bg-brand-heading/70 p-6">
          <div className={`${K_PANEL} w-full max-w-[640px] p-10 text-center shadow-card-hover`}>
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-warning-bg text-brand-warning-text"><Icon name="tiempo" className="h-11 w-11" /></span>
            <h2 id="kiosk-warn-title" className="mt-4 text-[34px] font-bold leading-tight">¿Sigues ahí?</h2>
            <p id="kiosk-warn-desc" className="mt-4 text-2xl leading-snug">
              Volveremos al inicio en <strong data-testid="kiosk-countdown" className="tabular-nums">{warning}</strong> segundos para el siguiente visitante.
            </p>
            <button type="button" autoFocus className={`${K_PRIMARY} mt-8 min-h-[72px] w-full px-10 text-2xl`} onClick={() => timerRef.current?.activity()}>
              Seguir explorando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Botón del logotipo: toque = inicio; pulsación mantenida 3 s = configuración oculta. */
function LogoButton({ onHome, onLongPress }: { onHome: () => void; onLongPress: () => void }) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const cancel = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const start = () => {
    cancel();
    firedRef.current = false;
    pressTimer.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  };
  useEffect(() => cancel, []);
  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (firedRef.current) {
          firedRef.current = false;
          return;
        }
        onHome();
      }}
      className="flex min-h-[72px] min-w-0 items-center gap-4 rounded-control px-1 text-left"
      aria-label="Ir al inicio del kiosco"
      data-testid="kiosk-logo"
    >
      <ComfasucreLogo className="h-[58px] w-[138px]" />
      <span className="min-w-0 border-l border-brand-border pl-4 leading-tight sm:pl-5">
        <span className="block text-[26px] font-bold text-brand-heading">Macondo Digital</span>
        <span className="mt-1 flex items-center gap-1 text-sm text-brand-muted">Biblioteca Macondo · Kiosco <Butterfly className="h-4 w-4" /></span>
      </span>
    </button>
  );
}

function KioskSession({ layout, onLongPressLogo }: { layout: KioskLayout; onLongPressLogo: () => void }) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ResourceDTO | null>(null);
  const vertical = layout.orientation === 'vertical';

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setView(q ? { kind: 'results', q } : { kind: 'home' });
  };

  const goFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className={`mx-auto flex min-h-[var(--k-vh)] w-full flex-col gap-4 px-4 py-4 sm:px-6 ${vertical ? 'max-w-[1240px]' : 'max-w-7xl'}`}>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <LogoButton onHome={() => { setView({ kind: 'home' }); setQuery(''); }} onLongPress={onLongPressLogo} />
        <button type="button" onClick={goFullscreen} className={`${K_TEXT} ml-auto text-base`}><Icon name="pantalla" className="h-5 w-5" /> Pantalla completa</button>
        <form role="search" onSubmit={onSearch} className={`${K_PANEL} flex w-full min-w-0 flex-wrap items-center gap-3 p-3 ${vertical ? '' : 'sm:flex-nowrap'}`}>
          <label htmlFor="kiosk-q" className="sr-only">Buscar en la biblioteca</label>
          <input
            id="kiosk-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué quieres leer o escuchar?"
            maxLength={100}
            autoComplete="off"
            className={`min-h-[64px] w-full min-w-0 flex-1 rounded-control border-2 border-brand-border bg-brand-surface px-4 text-[22px] text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none ${vertical ? '' : 'sm:w-auto'}`}
          />
          <button type="submit" className={`${K_PRIMARY} min-h-[64px] w-full px-8 text-xl ${vertical ? '' : 'sm:w-auto'}`}><Icon name="buscar" className="h-7 w-7" /> Buscar</button>
        </form>
      </header>

      {view.kind === 'home' ? (
        <>
          <section aria-labelledby="k-cat" className={K_PANEL}>
            <p className="mb-1 text-[15px] font-bold text-brand-accent-strong">Bienvenido</p>
            <h1 id="k-cat" className="text-[26px] font-bold leading-tight">Explora por categoría</h1>
            <ul className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${layout.categoryCols}, minmax(0, 1fr))` }} data-testid="kiosk-categories">
              {RESOURCE_TYPES.map((t, i) => (
                <li key={t} className={layout.categoryCols === 2 && i === RESOURCE_TYPES.length - 1 ? 'col-span-2' : ''}>
                  <button
                    type="button"
                    onClick={() => setView({ kind: 'results', type: t })}
                    className={`flex w-full min-w-0 items-center justify-center gap-4 rounded-card border-2 border-brand-border bg-[#f7fafc] p-4 text-center text-brand-primary transition-colors duration-brand hover:border-brand-primary hover:bg-brand-info-bg active:bg-brand-info-bg ${vertical ? 'min-h-[132px] flex-row' : 'min-h-[9rem] flex-col gap-2'}`}
                  >
                    <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary ${vertical ? 'h-[72px] w-[72px]' : 'h-16 w-16'}`}><Icon name={TYPE_ICONS[t]} className={vertical ? 'h-10 w-10' : 'h-9 w-9'} /></span>
                    <span className={`break-words font-bold leading-tight ${vertical ? 'text-[24px]' : 'text-[clamp(16px,1.45vw,21px)]'}`}>{RESOURCE_TYPE_LABELS[t]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="k-rec" className={K_PANEL}>
            <h2 id="k-rec" className="text-[27px] font-bold leading-tight">Recomendados</h2>
            <KioskGrid url={catalogUrl({ pageSize: vertical ? 12 : 10 })} cols={layout.gridCols} onSelect={setSelected} />
          </section>
        </>
      ) : (
        <section aria-labelledby="k-res" className={K_PANEL}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${K_SECONDARY} min-h-[64px]`} onClick={() => setView({ kind: 'home' })}>
              <Icon name="volver" className="h-6 w-6" /> Volver
            </button>
            <h1 id="k-res" className="min-w-0 break-words text-[26px] font-bold leading-tight">
              {view.type ? RESOURCE_TYPE_LABELS[view.type] : `Resultados para “${view.q}”`}
            </h1>
          </div>
          <KioskGrid url={catalogUrl({ q: view.q, type: view.type, pageSize: 30 })} cols={layout.gridCols} onSelect={setSelected} />
        </section>
      )}

      {selected && <KioskDetail resource={selected} layout={layout} onClose={() => setSelected(null)} />}
      <footer className="mt-auto pt-2 text-center text-sm text-brand-muted">
        Kiosco anónimo: no guardamos datos personales. La sesión se reinicia sola tras un tiempo sin uso.
      </footer>
    </div>
  );
}

function KioskGrid({ url, cols, onSelect }: { url: string; cols: number; onSelect: (r: ResourceDTO) => void }) {
  const [data, setData] = useState<ResourceDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    apiFetch<Paginated<ResourceDTO>>(url, { signal: ctrl.signal })
      .then((d) => setData(d.items.filter((r) => r.accessible)))
      .catch((e) => !ctrl.signal.aborted && setError(errorMessage(e)));
    return () => ctrl.abort();
  }, [url, nonce]);

  if (error)
    return (
      <div role="alert" className="mt-4 rounded-control border border-[#edc3ba] bg-brand-danger-bg p-6 text-center text-brand-danger-text">
        <p className="text-xl font-semibold">{error}</p>
        <button type="button" className={`${K_PRIMARY} mt-4 px-8`} onClick={() => setNonce((n) => n + 1)}><Icon name="refrescar" className="h-6 w-6" /> Reintentar</button>
      </div>
    );
  if (!data) return <p role="status" className="mt-4 flex items-center gap-3 text-xl text-brand-muted"><Icon name="cargando" className="h-7 w-7 animate-girar text-brand-accent" /> Cargando…</p>;
  if (data.length === 0) return <p className="mt-4 rounded-control bg-brand-soft p-5 text-center text-xl text-brand-muted">No encontramos recursos. Prueba otra búsqueda o categoría.</p>;
  return (
    <ul className="mt-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-testid="kiosk-grid">
      {data.map((r) => (
        <li key={r.id}>
          <button type="button" onClick={() => onSelect(r)} className="flex h-full w-full min-w-0 flex-col gap-2 rounded-card border-2 border-brand-border bg-brand-surface p-3 text-left transition-colors duration-brand hover:border-brand-primary active:border-brand-primary">
            <Cover resource={r} />
            <span className="hyphens-auto break-words text-lg font-bold leading-snug text-brand-primary">{r.title}</span>
            <span className="text-base text-brand-muted">{r.creator}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function KioskDetail({ resource: r, layout, onClose }: { resource: ResourceDTO; layout: KioskLayout; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState('');
  const vertical = layout.orientation === 'vertical';
  useEffect(() => {
    setOrigin(process.env.NEXT_PUBLIC_PUBLIC_ORIGIN || window.location.origin);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const canQr = r.accessible && origin;
  const qr = canQr ? (
    <>
      <QrCode value={`${origin}/recurso/${encodeURIComponent(r.id)}`} label={`Código QR para abrir ${r.title} en una tablet de la biblioteca`} size={layout.qrSize} />
      <p className={`text-center text-lg leading-snug ${vertical ? 'max-w-[360px]' : 'max-w-[240px]'}`}>Escanea con una tablet de la biblioteca para abrir este recurso.</p>
    </>
  ) : (
    <p className="max-w-[260px] text-center text-lg text-brand-muted">Este recurso no tiene código QR disponible.</p>
  );
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="k-detail-title" className="fixed inset-0 z-40 flex items-center justify-center bg-brand-heading/60 p-4">
      <div
        className={`${K_PANEL} grid w-full gap-6 overflow-auto shadow-card-hover ${vertical ? 'max-w-[960px] grid-cols-1' : 'max-w-5xl md:grid-cols-[220px_minmax(0,1fr)_auto]'}`}
        style={{ maxHeight: `calc(var(--k-vh) - 32px)` }}
        data-testid="kiosk-detail"
      >
        {vertical ? (
          <>
            <div className="flex items-start gap-5">
              <div className="w-[200px] shrink-0 sm:w-[240px]"><Cover resource={r} size="large" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-brand-accent-strong">{typeLabel(r.type)}</p>
                <h2 id="k-detail-title" className="break-words text-[30px] font-bold leading-tight">{r.title}</h2>
                <p className="text-[22px] text-brand-text">{r.creator}</p>
                <p className="mt-1 text-lg text-brand-muted">Grados {gradeRangeLabel(r.gradeMin, r.gradeMax)}</p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className={`${K_SECONDARY} min-h-[64px] shrink-0 px-6`}>
                <Icon name="cerrar" className="h-6 w-6" /> Cerrar
              </button>
            </div>
            {r.description && <p className="line-clamp-6 text-lg leading-snug">{r.description}</p>}
            {r.accessible && r.format === 'MP3' && r.hasFile && (
              <AudioPlayer resourceId={`kiosk-${r.id}`} src={fileUrl(r.id)} title={r.title} narrator={r.narrator} />
            )}
            <div className="flex flex-col items-center gap-3 rounded-card bg-brand-soft p-5">{qr}</div>
          </>
        ) : (
          <>
            <div className="mx-auto w-full max-w-[220px]"><Cover resource={r} size="large" /></div>
            <div>
              <p className="text-[15px] font-bold text-brand-accent-strong">{typeLabel(r.type)}</p>
              <h2 id="k-detail-title" className="break-words text-[27px] font-bold leading-tight">{r.title}</h2>
              <p className="text-xl text-brand-text">{r.creator}</p>
              <p className="mt-1 text-base text-brand-muted">Grados {gradeRangeLabel(r.gradeMin, r.gradeMax)}</p>
              {r.description && <p className="mt-3 line-clamp-6">{r.description}</p>}
              {r.accessible && r.format === 'MP3' && r.hasFile && (
                <div className="mt-4">
                  <AudioPlayer resourceId={`kiosk-${r.id}`} src={fileUrl(r.id)} title={r.title} narrator={r.narrator} />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              <button ref={closeRef} type="button" onClick={onClose} className={`${K_SECONDARY} self-end px-6`}>
                <Icon name="cerrar" className="h-6 w-6" /> Cerrar
              </button>
              {qr}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TIMEOUT_OPTIONS = [60, 90, 120, 180, 300];
const WARNING_OPTIONS = [10, 15, 20];

/**
 * Panel oculto de configuración (pulsación larga sobre el logotipo). Sin PIN: la protección frente al
 * público la da el modo kiosco del sistema/app; aquí no hay datos ni acciones sobre el catálogo.
 */
function KioskConfigPanel({ config, layout, onSave, onClose }: { config: KioskConfig; layout: KioskLayout; onSave: (c: KioskConfig) => void; onClose: () => void }) {
  const [scale, setScale] = useState<KioskScale>(config.scale);
  const [timeoutS, setTimeoutS] = useState(config.timeoutMs / 1000);
  const [warningS, setWarningS] = useState(config.warningMs / 1000);
  const [screen, setScreen] = useState<{ w: number; h: number; dpr: number } | null>(null);
  useEffect(() => {
    const read = () => setScreen({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  const choice = (active: boolean) =>
    `${K_BTN} min-h-[64px] flex-1 ${active ? 'border-brand-primary bg-brand-primary text-brand-on-primary' : 'border-brand-control-border bg-brand-soft text-brand-primary'}`;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="k-cfg-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-heading/70 p-4" data-testid="kiosk-config">
      <div className={`${K_PANEL} w-full max-w-[720px] overflow-auto p-7 shadow-card-hover`} style={{ maxHeight: 'calc(var(--k-vh) - 32px)' }}>
        <h2 id="k-cfg-title" className="text-[28px] font-bold leading-tight">Configuración del kiosco</h2>
        <p className="mt-1 text-base text-brand-muted">Solo presentación de este dispositivo. Se guarda en el propio kiosco.</p>

        <fieldset className="mt-6">
          <legend className="text-lg font-bold">Escala de la interfaz</legend>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Escala">
            {KIOSK_SCALES.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={scale === s} className={choice(scale === s)} onClick={() => setScale(s)}>
                ×{s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-brand-muted">Tótem 32": ×1.25 o ×1.5. Pantallas de 22–24": ×1.</p>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-lg font-bold">Volver al inicio tras</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Inactividad en segundos">
            {TIMEOUT_OPTIONS.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={timeoutS === s} className={choice(timeoutS === s)} onClick={() => setTimeoutS(s)}>
                {s} s
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-base">Aviso previo:</span>
            <div className="flex flex-1 gap-2" role="radiogroup" aria-label="Aviso en segundos">
              {WARNING_OPTIONS.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={warningS === s} className={choice(warningS === s)} onClick={() => setWarningS(s)}>
                  {s} s
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 rounded-card bg-brand-soft p-4 text-base">
          <dt className="text-brand-muted">Orientación detectada</dt>
          <dd className="font-bold" data-testid="kiosk-cfg-orientation">{layout.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}</dd>
          <dt className="text-brand-muted">Ventana</dt>
          <dd className="font-bold">{screen ? `${screen.w} × ${screen.h} px · DPR ${screen.dpr}` : '—'}</dd>
          <dt className="text-brand-muted">Efectivo con la escala</dt>
          <dd className="font-bold">{layout.width} × {layout.height} px</dd>
          <dt className="text-brand-muted">Por URL</dt>
          <dd className="font-mono text-sm">?escala={scale}&amp;inactividad={timeoutS}&amp;aviso={warningS}</dd>
        </dl>

        <div className="mt-6 flex gap-3">
          <button type="button" className={`${K_SECONDARY} min-h-[64px] flex-1`} onClick={onClose}>Cerrar</button>
          <button
            type="button"
            className={`${K_PRIMARY} min-h-[64px] flex-1`}
            onClick={() => {
              onSave({ scale, timeoutMs: timeoutS * 1000, warningMs: warningS * 1000 });
              onClose();
            }}
          >
            <Icon name="check" className="h-6 w-6" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
