import { TV_BLOCK_LABELS, TV_BLOCKS, TV_DEFAULT_SLIDE_SECONDS, TV_KIND_BLOCK, type TvBlock, type TvSlideDTO, type TvSlideKind } from '@macondo/shared';

export const TV_CACHE_KEY = 'macondo.tv.lastSchedule';
export const TV_REFETCH_MS = 5 * 60_000;
export const DEFAULT_SLIDE_SECONDS = TV_DEFAULT_SLIDE_SECONDS; // 20 s por bloque

/** Diapositiva institucional de respaldo cuando no hay programación ni caché. */
export const FALLBACK_SLIDES: TvSlideDTO[] = [
  {
    id: 'fallback-bienvenida',
    kind: 'MESSAGE',
    title: 'Biblioteca Macondo',
    body: 'Bienvenidos a Macondo Digital. Aquí cada historia abre una ventana al mundo. ¡Pregunta por nuestros libros, audiolibros y retos lectores!',
    order: 0,
    durationSeconds: 20,
    active: true,
    resourceId: null,
  },
  {
    id: 'fallback-lectura',
    kind: 'FUN_FACT',
    title: '¿Sabías que…?',
    body: 'Leer 20 minutos al día amplía el vocabulario y la imaginación. ¿Qué vas a leer hoy?',
    order: 1,
    durationSeconds: 20,
    active: true,
    resourceId: null,
  },
];

export function slideDurationMs(slide: Pick<TvSlideDTO, 'durationSeconds'>): number {
  const s = Number(slide.durationSeconds);
  const secs = Number.isFinite(s) && s >= 3 ? Math.min(600, s) : DEFAULT_SLIDE_SECONDS;
  return secs * 1000;
}

/** Filtra activas y vigentes ahora (defensivo: la API ya debería hacerlo) y ordena por `order`. */
export function validSlides(slides: unknown, now: Date = new Date()): TvSlideDTO[] {
  if (!Array.isArray(slides)) return [];
  return (slides as TvSlideDTO[])
    .filter((s) => s && typeof s === 'object' && typeof s.title === 'string' && typeof s.id === 'string')
    .filter((s) => s.active !== false)
    .filter((s) => !s.startsAt || new Date(s.startsAt) <= now)
    .filter((s) => !s.endsAt || new Date(s.endsAt) >= now)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export type ScheduleSource = 'live' | 'cache' | 'fallback';

/**
 * Decide qué programación mostrar.
 * - `fetched` válido y no vacío → live
 * - si la consulta falló (null) → última buena en caché
 * - sin nada → diapositivas institucionales de respaldo
 * Un arreglo vacío desde la API (no hay programación) también muestra el respaldo.
 */
export function resolveSchedule(
  fetched: TvSlideDTO[] | null,
  cached: TvSlideDTO[] | null,
  now: Date = new Date(),
): { slides: TvSlideDTO[]; source: ScheduleSource } {
  if (fetched) {
    const live = validSlides(fetched, now);
    if (live.length > 0) return { slides: live, source: 'live' };
    return { slides: FALLBACK_SLIDES, source: 'fallback' };
  }
  const fromCache = validSlides(cached, now);
  if (fromCache.length > 0) return { slides: fromCache, source: 'cache' };
  return { slides: FALLBACK_SLIDES, source: 'fallback' };
}

export function nextIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current + 1) % length;
}

export interface SlideRotator {
  start(): void;
  stop(): void;
  /** Reemplaza la lista (p. ej. tras refrescar); conserva la posición si es posible. */
  setSlides(slides: TvSlideDTO[]): void;
  current(): number;
}

/** Rota diapositivas usando la duración de cada una. */
export function createSlideRotator(initial: TvSlideDTO[], onChange: (index: number, slide: TvSlideDTO) => void): SlideRotator {
  let slides = initial.length ? initial : FALLBACK_SLIDES;
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    const slide = slides[index]!;
    timer = setTimeout(() => {
      index = nextIndex(index, slides.length);
      onChange(index, slides[index]!);
      schedule();
    }, slideDurationMs(slide));
  };

  return {
    start() {
      if (running) return;
      running = true;
      onChange(index, slides[index]!);
      schedule();
    },
    stop() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    setSlides(next) {
      const currentId = slides[index]?.id;
      slides = next.length ? next : FALLBACK_SLIDES;
      const found = slides.findIndex((s) => s.id === currentId);
      if (found >= 0) {
        index = found; // mantener la actual; el temporizador en curso sigue
      } else {
        index = 0;
        if (running) {
          onChange(index, slides[index]!);
          schedule();
        }
      }
    },
    current: () => index,
  };
}

/* ───────────── Programación en 6 bloques (rail «Programación» de la pantalla) ───────────── */

export function blockOf(kind: TvSlideKind | string): TvBlock {
  return TV_KIND_BLOCK[kind as TvSlideKind] ?? 'AGENDA';
}

export interface RailItem {
  block: TvBlock;
  label: string;
  /** Diapositivas de la programación actual que caen en este bloque. */
  slides: TvSlideDTO[];
  /** El bloque de la diapositiva EN PANTALLA. */
  onAir: boolean;
}

/** Siempre los 6 bloques en su orden fijo; marca el que está en pantalla. */
export function buildRail(slides: TvSlideDTO[], currentIndex: number): RailItem[] {
  const current = slides[currentIndex];
  const onAirBlock = current ? blockOf(current.kind) : null;
  return TV_BLOCKS.map((block) => ({
    block,
    label: TV_BLOCK_LABELS[block],
    slides: slides.filter((s) => blockOf(s.kind) === block),
    onAir: block === onAirBlock,
  }));
}

/** Avance de la diapositiva actual entre 0 y 1. */
export function slideProgress(startedAt: number, now: number, durationMs: number): number {
  if (!(durationMs > 0) || !Number.isFinite(startedAt) || !Number.isFinite(now)) return 0;
  return Math.min(1, Math.max(0, (now - startedAt) / durationMs));
}

/** Duración total de un ciclo completo (ms). */
export function cycleDurationMs(slides: TvSlideDTO[]): number {
  return slides.reduce((a, s) => a + slideDurationMs(s), 0);
}

/**
 * Origen público para los QR (lo escanean celulares en la sala, así que «localhost» no sirve):
 * `?origin=` en la URL de la TV → NEXT_PUBLIC_PUBLIC_ORIGIN (build) → origen de la página.
 */
export function publicOrigin(search: string, envOrigin: string | undefined, locationOrigin: string): string {
  const fromQuery = new URLSearchParams(search).get('origin');
  for (const candidate of [fromQuery, envOrigin, locationOrigin]) {
    if (!candidate) continue;
    try {
      const u = new URL(candidate);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.origin;
    } catch {
      /* siguiente candidato */
    }
  }
  return locationOrigin;
}

/** Líneas no vacías del texto de una diapositiva (agenda, pasos del tutorial, frase + invitación). */
export function bodyLines(body: string | null | undefined): string[] {
  return String(body ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** Separa «Actividad – cuándo» (guion largo, medio o « - »). */
export function splitAgendaLine(line: string): { what: string; when: string | null } {
  const m = /^(.*?)\s+[–—-]\s+(.+)$/.exec(line);
  return m ? { what: m[1]!.trim(), when: m[2]!.trim() } : { what: line, when: null };
}

/** `?animaciones=0` (también `no`/`false`/`off`): desactiva transiciones en equipos modestos. */
export function animationsDisabled(search: string): boolean {
  const v = new URLSearchParams(search).get('animaciones');
  return v != null && ['0', 'no', 'false', 'off'].includes(v.trim().toLowerCase());
}
