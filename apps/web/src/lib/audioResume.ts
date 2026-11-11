import { readJSON, writeJSON, removeKey } from './storage';

export const AUDIO_POSITION_PREFIX = 'macondo.audio.';
/** Por debajo de este punto no vale la pena reanudar. */
export const MIN_RESUME_SECONDS = 5;
/** Si faltan menos de estos segundos para el final, se considera terminado y se empieza de nuevo. */
export const END_THRESHOLD_SECONDS = 10;
/** Al reanudar retrocedemos unos segundos para dar contexto. */
export const REWIND_ON_RESUME_SECONDS = 3;

export interface SavedAudioPosition {
  position: number;
  duration: number | null;
  savedAt: string;
}

/** Función pura: posición desde la que debe reanudarse la reproducción. */
export function computeResumePosition(saved: number | null | undefined, duration: number | null | undefined): number {
  if (saved == null || !Number.isFinite(saved) || saved < MIN_RESUME_SECONDS) return 0;
  const d = duration != null && Number.isFinite(duration) && duration > 0 ? duration : null;
  if (d != null && d - saved < END_THRESHOLD_SECONDS) return 0;
  const target = Math.max(0, saved - REWIND_ON_RESUME_SECONDS);
  return d != null ? Math.min(target, d) : target;
}

export function audioKey(resourceId: string) {
  return `${AUDIO_POSITION_PREFIX}${resourceId}`;
}

export function saveAudioPosition(resourceId: string, position: number, duration: number | null) {
  if (!Number.isFinite(position) || position < 0) return;
  const value: SavedAudioPosition = {
    position: Math.round(position * 10) / 10,
    duration: duration != null && Number.isFinite(duration) ? duration : null,
    savedAt: new Date().toISOString(),
  };
  writeJSON(audioKey(resourceId), value);
}

export function loadAudioPosition(resourceId: string): SavedAudioPosition | null {
  const v = readJSON<SavedAudioPosition | null>(audioKey(resourceId), null);
  if (!v || typeof v.position !== 'number') return null;
  return v;
}

export function getResumePosition(resourceId: string, duration: number | null): number {
  const saved = loadAudioPosition(resourceId);
  return computeResumePosition(saved?.position, duration ?? saved?.duration ?? null);
}

export function clearAudioPosition(resourceId: string) {
  removeKey(audioKey(resourceId));
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
