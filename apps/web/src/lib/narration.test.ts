import { describe, expect, it } from 'vitest';
import { canNarrate, formatDuration, narrationText, ttsStatusLabel } from './narration';

describe('narración sintética (panel)', () => {
  it('canNarrate: audiobiografías/audioresúmenes o cualquier recurso con texto; nunca galerías ni EPUB/PDF', () => {
    expect(canNarrate({ type: 'AUDIOBIOGRAPHY', format: 'NONE', extra: null })).toBe(true);
    expect(canNarrate({ type: 'AUDIOSUMMARY', format: 'MP3', extra: null })).toBe(true);
    expect(canNarrate({ type: 'BOOK', format: 'NONE', extra: { text: 'Un cuento.' } })).toBe(true);
    expect(canNarrate({ type: 'BOOK', format: 'NONE', extra: { text: '   ' } })).toBe(false);
    expect(canNarrate({ type: 'BOOK', format: 'EPUB', extra: { text: 'Un cuento.' } })).toBe(false);
    expect(canNarrate({ type: 'AUDIOBOOK', format: 'MP3', extra: null })).toBe(false);
    expect(canNarrate({ type: 'GALLERY', format: 'NONE', extra: { text: 'x' } })).toBe(false);
    expect(canNarrate(null)).toBe(false);
  });
  it('narrationText recorta el texto', () => {
    expect(narrationText({ extra: { text: '  Hola  ' } })).toBe('Hola');
    expect(narrationText({ extra: null })).toBe('');
  });
  it('ttsStatusLabel', () => {
    expect(ttsStatusLabel({ enabled: true, engine: 'piper', voice: 'es_ES-davefx-medium', ok: true, detail: null })).toBe('Narración: Piper davefx · disponible');
    expect(ttsStatusLabel({ enabled: true, engine: 'piper', voice: 'es_ES-davefx-medium', ok: false, detail: 'binario no encontrado' })).toBe('Narración: Piper davefx · no disponible');
    expect(ttsStatusLabel({ enabled: false, engine: 'piper', voice: 'es_ES-davefx-medium', ok: false, detail: null })).toBe('Narración: Piper davefx · desactivada');
    expect(ttsStatusLabel(null)).toBe('Narración: Piper davefx · estado desconocido');
  });
  it('formatDuration', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(192.4)).toBe('3 min 12 s');
    expect(formatDuration(null)).toBe('');
  });
});
