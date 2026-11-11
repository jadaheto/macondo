import { clearPrefixed } from './storage';

/**
 * Temporizador de inactividad del kiosco.
 * IMPORTANTE: este temporizador solo limpia el estado de la sesión anónima. La restricción para
 * salir del modo kiosco (gestos, botón inicio, barra de navegación) DEBE aplicarse con el modo
 * kiosco / fijación de pantalla del sistema operativo; JavaScript no puede garantizarla.
 */
export const DEFAULT_KIOSK_TIMEOUT_MS = 90_000;
export const DEFAULT_KIOSK_WARNING_MS = 10_000;
export const KIOSK_CONFIG_KEY = 'macondo.kiosk.config';

export type KioskPhase = 'active' | 'warning' | 'stopped';

export interface InactivityTimerOptions {
  timeoutMs?: number;
  warningMs?: number;
  /** Se llama al entrar en fase de advertencia, con los segundos restantes. */
  onWarning?: (secondsLeft: number) => void;
  /** Cada segundo durante la advertencia. */
  onTick?: (secondsLeft: number) => void;
  /** Se acabó la advertencia sin actividad: limpiar y volver al inicio. */
  onExpire: () => void;
  /** La persona volvió a interactuar durante la advertencia. */
  onResume?: () => void;
}

export interface InactivityTimer {
  start(): void;
  stop(): void;
  /** Registrar actividad (toque, tecla, scroll). */
  activity(): void;
  phase(): KioskPhase;
}

export function createInactivityTimer(opts: InactivityTimerOptions): InactivityTimer {
  const timeoutMs = Math.max(1000, opts.timeoutMs ?? DEFAULT_KIOSK_TIMEOUT_MS);
  const warningMs = Math.max(1000, opts.warningMs ?? DEFAULT_KIOSK_WARNING_MS);
  let phase: KioskPhase = 'stopped';
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let secondsLeft = 0;

  const clearAll = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (tickTimer) clearInterval(tickTimer);
    idleTimer = null;
    tickTimer = null;
  };

  const enterWarning = () => {
    phase = 'warning';
    secondsLeft = Math.ceil(warningMs / 1000);
    opts.onWarning?.(secondsLeft);
    tickTimer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearAll();
        phase = 'active';
        opts.onExpire();
        armIdle(); // el kiosco sigue vigilando tras volver al inicio
      } else {
        opts.onTick?.(secondsLeft);
      }
    }, 1000);
  };

  const armIdle = () => {
    clearAll();
    idleTimer = setTimeout(enterWarning, timeoutMs);
  };

  return {
    start() {
      phase = 'active';
      armIdle();
    },
    stop() {
      clearAll();
      phase = 'stopped';
    },
    activity() {
      if (phase === 'stopped') return;
      const wasWarning = phase === 'warning';
      phase = 'active';
      armIdle();
      if (wasWarning) opts.onResume?.();
    },
    phase: () => phase,
  };
}

/** Escalas admitidas para el kiosco de 32" (`?escala=` o configuración guardada). 1 = pantallas ≤ 24". */
export const KIOSK_SCALES = [1, 1.25, 1.5, 1.75] as const;
export type KioskScale = (typeof KIOSK_SCALES)[number];

export interface KioskConfig {
  timeoutMs: number;
  warningMs: number;
  /** Factor de ampliación de toda la interfaz (CSS `zoom`). */
  scale: KioskScale;
}

/** Valores guardados en localStorage (`macondo.kiosk.config`), en segundos para que sean legibles. */
export interface KioskStoredConfig {
  timeoutSeconds?: number;
  warningSeconds?: number;
  scale?: number;
}

export function parseKioskScale(raw: unknown): KioskScale {
  const n = typeof raw === 'string' ? Number(raw.replace(',', '.')) : raw;
  return (KIOSK_SCALES as readonly number[]).includes(n as number) ? (n as KioskScale) : 1;
}

/** Lee la configuración del kiosco (persistente en el dispositivo; no se borra al reiniciar sesión). */
export function parseKioskConfig(raw: unknown): KioskConfig {
  const o = (raw && typeof raw === 'object' ? raw : {}) as { timeoutSeconds?: unknown; warningSeconds?: unknown; scale?: unknown };
  const t = typeof o.timeoutSeconds === 'number' && o.timeoutSeconds >= 5 && o.timeoutSeconds <= 3600 ? o.timeoutSeconds : 90;
  const w = typeof o.warningSeconds === 'number' && o.warningSeconds >= 3 && o.warningSeconds <= 60 ? o.warningSeconds : 10;
  return { timeoutMs: t * 1000, warningMs: w * 1000, scale: parseKioskScale(o.scale) };
}

/**
 * Parámetros de la URL del kiosco: `?inactividad=120&aviso=10&escala=1.5`. Solo devuelve las claves
 * presentes, para fusionarlas sobre la configuración guardada (la URL manda: es lo que fija la app Android).
 */
export function kioskConfigFromSearch(search: string): KioskStoredConfig {
  const sp = new URLSearchParams(search);
  const out: KioskStoredConfig = {};
  if (sp.has('inactividad')) out.timeoutSeconds = Number(sp.get('inactividad'));
  if (sp.has('aviso')) out.warningSeconds = Number(sp.get('aviso'));
  if (sp.has('escala')) out.scale = parseKioskScale(sp.get('escala'));
  return out;
}

/** Configuración efectiva = guardada ← URL (la URL pisa las claves que trae). */
export function resolveKioskConfig(stored: unknown, search: string): { config: KioskConfig; stored: KioskStoredConfig } {
  const base = (stored && typeof stored === 'object' ? stored : {}) as KioskStoredConfig;
  const merged: KioskStoredConfig = { ...base, ...kioskConfigFromSearch(search) };
  return { config: parseKioskConfig(merged), stored: merged };
}

/** Convierte la configuración efectiva al formato que se guarda. */
export function toStoredConfig(cfg: KioskConfig): Required<KioskStoredConfig> {
  return { timeoutSeconds: cfg.timeoutMs / 1000, warningSeconds: cfg.warningMs / 1000, scale: cfg.scale };
}

export type KioskOrientation = 'vertical' | 'horizontal';

export interface KioskLayout {
  orientation: KioskOrientation;
  /** Ancho/alto efectivos en píxeles CSS tras aplicar la escala. */
  width: number;
  height: number;
  /** Columnas de la cuadrícula de categorías (5 tipos). */
  categoryCols: 2 | 3 | 5;
  /** Columnas de las cuadrículas de recursos. */
  gridCols: number;
  /** Lado del QR del detalle en px (antes de la escala). */
  qrSize: number;
}

/**
 * Maquetación del kiosco según el tamaño real de la ventana y la escala. Totem 32" vertical
 * (1080×1920 o 1200×1920) → 2 columnas de categorías (la quinta ocupa toda la fila) y 2–3 de
 * recursos; horizontal (1920×1080) → 5 categorías y 3–5 recursos. Las anchuras se evalúan en
 * píxeles «efectivos» (ventana ÷ escala) porque las media queries no cambian con CSS `zoom`.
 */
export function kioskLayout(innerWidth: number, innerHeight: number, scale: number): KioskLayout {
  const s = scale > 0 ? scale : 1;
  const width = Math.max(320, Math.round(innerWidth / s));
  const height = Math.max(320, Math.round(innerHeight / s));
  const orientation: KioskOrientation = height > width ? 'vertical' : 'horizontal';
  if (orientation === 'vertical') {
    const gridCols = Math.min(4, Math.max(2, Math.floor(width / 330)));
    return { orientation, width, height, categoryCols: 2, gridCols, qrSize: width >= 700 ? 320 : 260 };
  }
  const gridCols = Math.min(6, Math.max(2, Math.floor(width / 360)));
  return { orientation, width, height, categoryCols: width >= 900 ? 5 : 3, gridCols, qrSize: 240 };
}

/**
 * Estilo del contenedor raíz para ampliar la interfaz. Preferimos CSS `zoom` (Chromium, WebView
 * Android, Safari; Firefox ≥ 126): la maquetación, los eventos y los elementos `position: fixed`
 * siguen funcionando. Solo si el motor no lo admite se recurre a `transform: scale`, compensando
 * el ancho (los overlays fijos quedan entonces relativos al contenedor, que cubre la ventana).
 */
export function kioskScaleStyle(scale: number, supportsZoom: boolean): Record<string, string | number> {
  if (scale === 1) return {};
  if (supportsZoom) return { zoom: scale };
  return {
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
    width: `${(100 / scale).toFixed(4)}%`,
    minHeight: `calc(100vh / ${scale})`,
  };
}

/**
 * Limpia el estado de la sesión anónima del kiosco: todo `macondo.*` en localStorage salvo la
 * configuración del kiosco y la caché de TV, y todo sessionStorage.
 */
export function clearKioskSession(): void {
  clearPrefixed([KIOSK_CONFIG_KEY, 'macondo.tv.lastSchedule'], 'local');
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignorar */
  }
}
