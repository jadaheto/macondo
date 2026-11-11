'use client';

/**
 * Biblioteca TV (Macondo TV): señalización digital en bucle, sin sonido ni cursor, 1080p primero
 * (escala con --u: 1u = 19,2 px a 1920×1080; funciona igual en 720p y 4K).
 * Escenario grande con la diapositiva EN PANTALLA + rail «Programación» con los 6 bloques
 * (libro de la semana, agenda, curiosidades, autor destacado, frases y retos, tutorial) y barra de avance.
 * Recupera la programación cada 5 minutos; si falla, conserva la última buena (localStorage) y, si no
 * hay ninguna, muestra diapositivas institucionales de respaldo.
 * Parámetros de URL (equipo de sala: Dell OptiPlex 3000 Thin Client con Edge en modo kiosco, ver
 * infra/tv-windows/): `?origin=https://…` fija el origen público de los QR cuando la TV abre la web por
 * una dirección distinta de la que escanean las tablets; `?animaciones=0` desactiva transiciones y
 * animaciones (equipos modestos), equivalente a `prefers-reduced-motion`.
 */
import { useEffect, useRef, useState } from 'react';
import { API_ROUTES, TV_BLOCK_LABELS, type TvBlock, type TvSlideDTO } from '@macondo/shared';
import { apiFetch } from '@/lib/api';
import {
  animationsDisabled, blockOf, bodyLines, buildRail, createSlideRotator, publicOrigin, resolveSchedule, slideDurationMs, slideProgress, splitAgendaLine,
  TV_CACHE_KEY, TV_REFETCH_MS, type ScheduleSource,
} from '@/lib/tvRotation';
import { readJSON, writeJSON } from '@/lib/storage';
import { Butterfly } from '@/components/Butterfly';
import { Cover } from '@/components/Cover';
import { Icon, type IconName } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { ComfasucreLogo } from '@/components/Wordmark';

/** Unidad de escala de sala (equivale a --tv-scale de turnos-pantalla-publica.css). */
const U = (n: number) => `calc(var(--u) * ${n})`;

const BLOCK_ICON: Record<TvBlock, IconName> = {
  BOOK_OF_WEEK: 'libro',
  AGENDA: 'agenda',
  FUN_FACT: 'bombillo',
  FEATURED_AUTHOR: 'autor',
  CHALLENGE: 'trofeo',
  TUTORIAL: 'info',
};
const BLOCK_EYEBROW: Record<TvBlock, string> = {
  BOOK_OF_WEEK: 'Libro destacado',
  AGENDA: 'Agenda cultural',
  FUN_FACT: '¿Sabías que…?',
  FEATURED_AUTHOR: 'Autor destacado',
  CHALLENGE: 'Frase para pensar',
  TUTORIAL: 'Paso a paso',
};

const CALL = { background: 'var(--sala-call)', boxShadow: '0 8px 24px rgba(7, 62, 117, 0.1)' } as const;

export default function TvPage() {
  const [slides, setSlides] = useState<TvSlideDTO[]>(() => resolveSchedule(null, null).slides);
  const [source, setSource] = useState<ScheduleSource>('fallback');
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [tick, setTick] = useState(() => Date.now());
  const [now, setNow] = useState<Date | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [noMotion, setNoMotion] = useState(false);
  const rotatorRef = useRef<ReturnType<typeof createSlideRotator> | null>(null);

  // Rotación (cada diapositiva usa su duración; la programación estándar es de 20 s)
  useEffect(() => {
    const rot = createSlideRotator(slides, (i) => {
      setIndex(i);
      setStartedAt(Date.now());
    });
    rotatorRef.current = rot;
    rot.start();
    return () => rot.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Programación: caché inmediata + consulta + refresco periódico
  useEffect(() => {
    let alive = true;
    const apply = (fetched: TvSlideDTO[] | null) => {
      const cached = readJSON<TvSlideDTO[] | null>(TV_CACHE_KEY, null);
      const res = resolveSchedule(fetched, cached);
      if (!alive) return;
      setSlides(res.slides);
      setSource(res.source);
      rotatorRef.current?.setSlides(res.slides);
    };
    const load = async () => {
      try {
        const data = await apiFetch<TvSlideDTO[]>(API_ROUTES.tvSchedule, { timeoutMs: 10000 });
        const list = Array.isArray(data) ? data : [];
        writeJSON(TV_CACHE_KEY, list);
        apply(list);
      } catch {
        apply(null); // conservar la última programación buena
      }
    };
    apply(null);
    void load();
    const id = setInterval(load, TV_REFETCH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Reloj, avance y origen público para los QR
  useEffect(() => {
    setNow(new Date());
    setOrigin(publicOrigin(window.location.search, process.env.NEXT_PUBLIC_PUBLIC_ORIGIN, window.location.origin));
    setNoMotion(animationsDisabled(window.location.search));
    const clock = setInterval(() => setNow(new Date()), 30_000);
    const prog = setInterval(() => setTick(Date.now()), 250);
    return () => {
      clearInterval(clock);
      clearInterval(prog);
    };
  }, []);

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex] ?? slides[0]!;
  const block = blockOf(slide.kind);
  const progress = slideProgress(startedAt, tick, slideDurationMs(slide));
  const rail = buildRail(slides, safeIndex);
  const secondsLeft = Math.max(0, Math.ceil((slideDurationMs(slide) * (1 - progress)) / 1000));

  return (
    <main
      className={`relative flex h-full w-full flex-col ${noMotion ? 'sin-animaciones' : ''}`}
      style={{ ['--u' as string]: 'min(1vw, 1.7778vh)' }}
      data-testid="tv-root"
      data-source={source}
      data-animaciones={noMotion ? '0' : '1'}
      aria-live="off"
    >
      {/* Cabecera blanca de sala con logo Comfasucre (branding.md §3.5, §9). */}
      <header
        className="flex shrink-0 items-center justify-between border-b border-brand-border bg-brand-surface"
        style={{ minHeight: U(4.6), padding: `${U(0.52)} ${U(1.67)}`, gap: U(0.83) }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: U(1.15) }}>
          <ComfasucreLogo className="" style={{ width: U(6.98), height: U(3.125) }} />
          <span className="shrink-0 bg-brand-control-border" style={{ width: 1, height: U(2.5) }} aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate font-extrabold leading-tight text-brand-heading" style={{ fontSize: U(1.5625) }}>Biblioteca TV</p>
            <p className="flex items-center text-brand-muted" style={{ fontSize: U(0.85), gap: U(0.3), marginTop: U(0.2) }}>
              Programación automática · Biblioteca Macondo <Butterfly className="h-[1em] w-[1em]" />
            </p>
          </div>
        </div>
        {now && (
          <div className="shrink-0 text-right">
            <p className="text-brand-muted first-letter:uppercase" style={{ fontSize: U(0.85) }}>
              {now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <time className="block font-extrabold tabular-nums leading-tight text-[#072f60]" style={{ fontSize: U(1.875) }} dateTime={now.toISOString()}>
              {now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        )}
      </header>

      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: `minmax(0, 1fr) ${U(25)}`, padding: U(0.83), gap: U(0.83) }}>
        {/* Escenario */}
        <div className="flex min-h-0 min-w-0 flex-col" style={{ gap: U(0.6) }}>
          <div className="flex items-center" style={{ gap: U(0.7) }}>
            <span className="inline-flex items-center rounded-full bg-[#fff0ce] font-extrabold uppercase tracking-wide text-[#895400]" style={{ fontSize: U(0.8), padding: `${U(0.25)} ${U(0.8)}`, gap: U(0.4) }}>
              <span className="inline-block rounded-full bg-[#c4302b]" style={{ width: U(0.55), height: U(0.55) }} aria-hidden="true" />
              En pantalla
            </span>
            <span className="truncate font-bold text-brand-heading" style={{ fontSize: U(1.05) }}>{TV_BLOCK_LABELS[block]}</span>
            <span className="ml-auto shrink-0 tabular-nums text-brand-muted" style={{ fontSize: U(0.85) }}>
              {safeIndex + 1} / {slides.length}
            </span>
          </div>
          <section
            key={slide.id + ':' + safeIndex}
            className="flex min-h-0 flex-1 animate-tv-entrar"
            data-testid="tv-slide"
            data-slide-id={slide.id}
            data-block={block}
          >
            <Stage slide={slide} block={block} origin={origin} />
          </section>
          <div className="overflow-hidden rounded-full bg-brand-border" style={{ height: U(0.35) }} aria-hidden="true">
            <div className="h-full rounded-full bg-brand-secondary transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} data-testid="tv-progress" />
          </div>
        </div>

        {/* Rail de programación: los 6 bloques en orden */}
        <aside className="flex min-h-0 flex-col rounded-panel border border-brand-border bg-brand-surface shadow-card" style={{ padding: U(0.9), gap: U(0.5) }} data-testid="tv-rail" aria-label="Programación">
          <p className="font-extrabold uppercase tracking-wide text-brand-heading" style={{ fontSize: U(0.85) }}>Programación</p>
          <ol className="flex min-h-0 flex-1 flex-col" style={{ gap: U(0.45) }}>
            {rail.map((item) => (
              <li
                key={item.block}
                data-block={item.block}
                data-on-air={item.onAir ? 'true' : 'false'}
                className={`flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-panel border transition-colors duration-500 ${item.onAir ? 'border-transparent text-white' : 'border-brand-border bg-brand-soft text-brand-text'} ${item.slides.length === 0 ? 'opacity-50' : ''}`}
                style={{ ...(item.onAir ? CALL : {}), padding: `${U(0.45)} ${U(0.7)}` }}
              >
                <div className="flex items-center" style={{ gap: U(0.55) }}>
                  <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${item.onAir ? 'bg-white/15' : 'bg-white text-brand-secondary'}`} style={{ width: U(2), height: U(2) }}>
                    <Icon name={BLOCK_ICON[item.block]} className="h-[58%] w-[58%]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-bold leading-tight" style={{ fontSize: U(0.82) }}>{item.label}</span>
                    <span className={`block truncate ${item.onAir ? 'text-[#d7e8fa]' : 'text-brand-muted'}`} style={{ fontSize: U(0.68), marginTop: U(0.1) }}>
                      {item.slides[0] ? (item.slides[0].resource?.title ?? item.slides[0].title) : 'Sin contenido programado'}
                    </span>
                  </span>
                  {item.onAir && (
                    <span className="shrink-0 rounded-full bg-white font-extrabold uppercase text-[#063b75]" style={{ fontSize: U(0.55), padding: `${U(0.15)} ${U(0.45)}` }}>
                      En pantalla
                    </span>
                  )}
                </div>
                {item.onAir && (
                  <div className="overflow-hidden rounded-full bg-white/25" style={{ height: U(0.25), marginTop: U(0.4) }} role="progressbar" aria-label="Avance del bloque en pantalla" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                    <div className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ol>
          <p className="text-brand-muted" style={{ fontSize: U(0.62) }}>
            Cambia en {secondsLeft} s
            {source !== 'live' && <> · {source === 'cache' ? 'programación guardada' : 'modo respaldo'}</>}
          </p>
        </aside>
      </div>
    </main>
  );
}

/* ───────────────────────── Escenario por bloque ───────────────────────── */

function Eyebrow({ block, light = true }: { block: TvBlock; light?: boolean }) {
  return (
    <p className={`inline-flex items-center font-extrabold uppercase tracking-wide ${light ? 'text-white' : 'text-brand-secondary'}`} style={{ fontSize: U(1), gap: U(0.5) }}>
      <span className={`inline-flex items-center justify-center rounded-full ${light ? 'bg-white/10' : 'bg-brand-soft'}`} style={{ width: U(2.3), height: U(2.3) }}>
        <Icon name={BLOCK_ICON[block]} className="h-[60%] w-[60%]" />
      </span>
      {BLOCK_EYEBROW[block]}
    </p>
  );
}

function Ring() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute rounded-full"
      style={{ right: U(-2.6), bottom: U(-3.6), width: U(14), height: U(14), border: `${U(1.4)} solid rgba(255,255,255,0.05)` }}
    />
  );
}

function QrCard({ url, title, hint }: { url: string; title: string; hint: string }) {
  return (
    <div className="flex shrink-0 items-center rounded-panel bg-white text-brand-text" style={{ padding: U(0.7), gap: U(0.8) }}>
      <div style={{ width: U(7), height: U(7) }} className="[&_img]:h-full [&_img]:w-full [&_img]:border-0 [&_img]:p-0">
        <QrCode value={url} label={`Código QR: ${title}`} size={360} />
      </div>
      <div style={{ maxWidth: U(11) }}>
        <p className="font-extrabold text-brand-heading" style={{ fontSize: U(1.05) }}>{title}</p>
        <p className="text-brand-muted" style={{ fontSize: U(0.75), marginTop: U(0.2) }}>{hint}</p>
      </div>
    </div>
  );
}

function Stage({ slide, block, origin }: { slide: TvSlideDTO; block: TvBlock; origin: string | null }) {
  const lines = bodyLines(slide.body);
  const res = slide.resource ?? null;
  const resourceUrl = res && origin ? `${origin}/recurso/${res.id}` : null;

  // Mensaje institucional (y respaldo sin programación): logo + texto centrado
  if (slide.kind === 'MESSAGE' && !res) {
    return (
      <div className="relative flex min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-panel text-center text-white" style={{ ...CALL, padding: U(2.2) }}>
        <Ring />
        <span className="relative rounded-panel bg-white" style={{ padding: `${U(1.2)} ${U(2)}` }}>
          <ComfasucreLogo className="" style={{ width: U(20), height: U(8.8) }} />
        </span>
        <h1 className="relative font-extrabold leading-tight text-white" style={{ fontSize: U(3.4), marginTop: U(1.6) }}>{slide.title}</h1>
        {slide.body && <p className="relative whitespace-pre-line leading-snug" style={{ fontSize: U(1.5), marginTop: U(0.8), maxWidth: U(60) }}>{slide.body}</p>}
      </div>
    );
  }

  // Libro de la semana y autor destacado: portada autorizada + llamado + QR
  if (block === 'BOOK_OF_WEEK' || block === 'FEATURED_AUTHOR') {
    const synopsis = slide.body?.trim() || res?.description?.trim() || '';
    const isAuthor = block === 'FEATURED_AUTHOR';
    return (
      <div className={`grid min-h-0 w-full ${res ? '' : 'grid-cols-1'}`} style={{ gap: U(0.83), gridTemplateColumns: res ? `minmax(0, 34fr) minmax(0, 66fr)` : undefined }}>
        {res && (
          <div className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-panel border border-brand-border bg-brand-surface shadow-card" style={{ padding: U(1.2), gap: U(0.6) }}>
            {/* Caja 3:4 que llena el panel (unidades de contenedor): en 4K la miniatura se amplía sin franjas;
                antes la imagen quedaba al tamaño intrínseco del srcset (~280 px). */}
            <div className="relative min-h-0 w-full flex-1 [container-type:size]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [&_img]:h-full [&_img]:w-full"
                style={{ width: 'min(100cqw, 75cqh)', height: 'min(100cqh, 133.333cqw)' }}
              >
                <Cover resource={res} size="large" />
              </div>
            </div>
            {isAuthor && <p className="text-center text-brand-muted" style={{ fontSize: U(0.8) }}>En Macondo Digital: <strong className="text-brand-heading">{res.title}</strong></p>}
          </div>
        )}
        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-panel text-white" style={{ ...CALL, padding: U(2) }}>
          <Ring />
          <div className="relative flex min-h-0 flex-1 flex-col justify-center">
            <Eyebrow block={block} />
            <h1 className="line-clamp-2 break-words font-extrabold leading-[1.06] text-white" style={{ fontSize: U(3.6), marginTop: U(0.8) }}>
              {isAuthor ? slide.title : res?.title ?? slide.title}
            </h1>
            {!isAuthor && res && <p className="text-[#d7e8fa]" style={{ fontSize: U(1.6), marginTop: U(0.4) }}>{res.creator}</p>}
            {!isAuthor && res && slide.title !== res.title && slide.title !== TV_BLOCK_LABELS[block] && <p className="font-semibold text-white/90" style={{ fontSize: U(1.15), marginTop: U(0.3) }}>{slide.title}</p>}
            {synopsis && <p className="line-clamp-5 whitespace-pre-line leading-snug" style={{ fontSize: U(1.4), marginTop: U(1.1), maxWidth: U(48) }}>{synopsis}</p>}
          </div>
          {resourceUrl && (
            <div className="relative flex items-end justify-between" style={{ gap: U(1), marginTop: U(1) }}>
              <p className="text-[#d7e8fa]" style={{ fontSize: U(0.95), maxWidth: U(22) }}>
                {isAuthor ? 'Conoce su obra en las tablets y el kiosco.' : 'Conoce al autor, la sinopsis y dónde encontrar el libro.'}
              </p>
              <QrCard url={resourceUrl} title="Escanea y descubre más" hint="Abre la ficha en Macondo Digital" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Agenda: actividades como tarjetas grandes (texto: una actividad por línea, «Actividad – cuándo»)
  if (block === 'AGENDA') {
    const items = lines.map(splitAgendaLine);
    return (
      <div className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-panel text-white" style={{ ...CALL, padding: U(2) }}>
        <Ring />
        <div className="relative">
          <Eyebrow block={block} />
          <h1 className="font-extrabold leading-tight text-white" style={{ fontSize: U(3), marginTop: U(0.6) }}>{slide.title}</h1>
        </div>
        {items.length > 0 ? (
          <ul className="relative grid min-h-0 flex-1 content-center" style={{ gridTemplateColumns: items.length > 3 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: U(0.8), marginTop: U(1.2) }}>
            {items.slice(0, 6).map((it, i) => (
              <li key={i} className="flex items-center rounded-panel bg-white text-brand-text" style={{ padding: `${U(0.9)} ${U(1.1)}`, gap: U(0.9) }}>
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-secondary" style={{ width: U(3), height: U(3) }}>
                  <Icon name="agenda" className="h-[55%] w-[55%]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold leading-tight text-brand-heading" style={{ fontSize: U(1.4) }}>{it.what}</span>
                  {it.when && <span className="block font-semibold text-brand-secondary" style={{ fontSize: U(1.1), marginTop: U(0.2) }}>{it.when}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  // Curiosidades: superficie clara, dato en grande
  if (block === 'FUN_FACT') {
    return (
      <div className="relative flex min-h-0 w-full items-center overflow-hidden rounded-panel border border-brand-border bg-brand-surface shadow-card" style={{ padding: U(2.4), gap: U(2.4) }}>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full text-white" style={{ ...CALL, width: U(11), height: U(11) }}>
          <Icon name="bombillo" className="h-[55%] w-[55%]" />
        </span>
        <div className="min-w-0">
          <Eyebrow block={block} light={false} />
          <h1 className="font-extrabold leading-tight text-brand-heading" style={{ fontSize: U(2.8), marginTop: U(0.6) }}>{slide.title}</h1>
          {slide.body && <p className="line-clamp-6 whitespace-pre-line leading-snug text-brand-text" style={{ fontSize: U(1.7), marginTop: U(1) }}>{slide.body}</p>}
        </div>
      </div>
    );
  }

  // Frases y retos: cita grande + invitación con QR a /retos
  if (block === 'CHALLENGE') {
    const attributionIdx = lines.findIndex((l) => /^[—–-]\s?/.test(l));
    const quote = attributionIdx > 0 ? lines.slice(0, attributionIdx).join(' ') : lines[0] ?? '';
    const attribution = attributionIdx >= 0 ? lines[attributionIdx] : null;
    const invitation = lines.slice(attributionIdx >= 0 ? attributionIdx + 1 : 1);
    return (
      <div className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-panel text-white" style={{ ...CALL, padding: U(2.2) }}>
        <Ring />
        <div className="relative flex min-h-0 flex-1 flex-col justify-center">
          <Eyebrow block={block} />
          <blockquote className="font-extrabold leading-[1.15]" style={{ fontSize: U(3), marginTop: U(1), maxWidth: U(56) }}>
            <span aria-hidden="true" className="text-[#7fd3f2]">«</span>{quote.replace(/^[«"“]|[»"”]$/g, '')}<span aria-hidden="true" className="text-[#7fd3f2]">»</span>
          </blockquote>
          {attribution && <p className="text-[#d7e8fa]" style={{ fontSize: U(1.4), marginTop: U(0.7) }}>{attribution}</p>}
        </div>
        <div className="relative flex items-end justify-between" style={{ gap: U(1), marginTop: U(1) }}>
          <div className="min-w-0">
            <p className="font-extrabold" style={{ fontSize: U(1.5) }}>{slide.title}</p>
            {invitation.map((l, i) => <p key={i} className="text-[#d7e8fa]" style={{ fontSize: U(1.05), marginTop: U(0.2) }}>{l}</p>)}
          </div>
          {origin && <QrCard url={`${origin}/retos`} title="Escanea y juega" hint="Retos lectores de Macondo Digital" />}
        </div>
      </div>
    );
  }

  // Tutorial: pasos numerados (una línea por paso)
  const steps = lines.length ? lines : ['Elige tu grado.', 'Busca un libro o audiolibro.', 'Toca «Leer» o «Escuchar».'];
  return (
    <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-panel border border-brand-border bg-brand-surface shadow-card" style={{ padding: U(2) }}>
      <div className="flex items-start justify-between" style={{ gap: U(1) }}>
        <div className="min-w-0">
          <Eyebrow block="TUTORIAL" light={false} />
          <h1 className="font-extrabold leading-tight text-brand-heading" style={{ fontSize: U(2.8), marginTop: U(0.5) }}>{slide.title}</h1>
        </div>

      </div>
      <ol className="grid min-h-0 flex-1 content-center" style={{ gridTemplateColumns: `repeat(${Math.min(3, steps.length > 4 ? 3 : Math.max(2, steps.length))}, minmax(0, 1fr))`, gap: U(0.9), marginTop: U(1.2) }}>
        {steps.slice(0, 6).map((st, i) => (
          <li key={i} className="flex flex-col rounded-panel border border-brand-border bg-brand-soft" style={{ padding: U(1.1), gap: U(0.6) }}>
            <span className="inline-flex items-center justify-center rounded-full font-extrabold text-white" style={{ ...CALL, width: U(2.8), height: U(2.8), fontSize: U(1.4) }}>{i + 1}</span>
            <p className="font-semibold leading-snug text-brand-text" style={{ fontSize: U(1.35) }}>{st}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
