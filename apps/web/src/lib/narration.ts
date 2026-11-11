import { TTS_VOICE_NAME, type ResourceDTO, type TtsStatus } from '@macondo/shared';

/** Reglas puras del panel para la narración sintética (ADR-017). */

/** Tipos cuyo archivo es una narración de un texto propio: la regrabación tiene sentido aunque aún no haya texto. */
const NARRATED_TYPES: ReadonlySet<ResourceDTO['type']> = new Set(['AUDIOBIOGRAPHY', 'AUDIOSUMMARY']);

/** ¿Se muestra el bloque «Regrabar con la voz de la biblioteca»? Audiobiografías/audioresúmenes o cualquier recurso con `extra.text`, salvo galerías y recursos con EPUB/PDF. */
export function canNarrate(r: Pick<ResourceDTO, 'type' | 'format' | 'extra'> | null | undefined): boolean {
  if (!r || r.type === 'GALLERY') return false;
  if (r.format === 'EPUB' || r.format === 'PDF' || r.format === 'IMAGE_SET') return false;
  return NARRATED_TYPES.has(r.type) || !!r.extra?.text?.trim();
}

/** Texto que se narrará (vacío si el recurso no tiene `extra.text`). */
export function narrationText(r: Pick<ResourceDTO, 'extra'> | null | undefined): string {
  return r?.extra?.text?.trim() ?? '';
}

/** «Narración: Piper davefx · disponible» para el Resumen y el formulario. */
export function ttsStatusLabel(status: TtsStatus | null | undefined): string {
  if (!status) return `Narración: ${TTS_VOICE_NAME} · estado desconocido`;
  const voice = status.voice ? status.voice.replace(/^es_ES-/, '').replace(/-medium$/, '') : '';
  const name = status.engine === 'piper' && voice ? `Piper ${voice}` : status.engine || TTS_VOICE_NAME;
  if (!status.enabled) return `Narración: ${name} · desactivada`;
  return `Narración: ${name} · ${status.ok ? 'disponible' : 'no disponible'}`;
}

/** «3 min 12 s», «45 s». */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '';
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${s % 60} s` : `${s} s`;
}
