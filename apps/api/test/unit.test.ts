import { describe, expect, it } from 'vitest';
import { parseRange } from '../src/catalog/range';
import { isMp3, safeExtension, UploadValidationError, validateUpload } from '../src/common/upload-validation';
import { isValidStorageKey } from '../src/storage/storage.provider';

describe('parseRange', () => {
  it('interpreta rangos válidos', () => {
    expect(parseRange(undefined, 100)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=0-9', 100)).toEqual({ kind: 'partial', range: { start: 0, end: 9 } });
    expect(parseRange('bytes=90-', 100)).toEqual({ kind: 'partial', range: { start: 90, end: 99 } });
    expect(parseRange('bytes=-5', 100)).toEqual({ kind: 'partial', range: { start: 95, end: 99 } });
    expect(parseRange('bytes=50-500', 100)).toEqual({ kind: 'partial', range: { start: 50, end: 99 } });
  });
  it('detecta rangos no satisfacibles', () => {
    expect(parseRange('bytes=100-', 100)).toEqual({ kind: 'unsatisfiable' });
    expect(parseRange('bytes=9-3', 100)).toEqual({ kind: 'unsatisfiable' });
    expect(parseRange('bytes=-0', 100)).toEqual({ kind: 'unsatisfiable' });
  });
});

describe('validación de subidas', () => {
  it('extensión segura y MP3', () => {
    expect(safeExtension('../../a/b.PDF')).toBe('pdf');
    expect(safeExtension('..\\..\\x.Mp3')).toBe('mp3');
    expect(safeExtension('noext')).toBe('');
    expect(isMp3(Buffer.from('ID3abc'))).toBe(true);
    expect(isMp3(Buffer.from([0xff, 0xf3]))).toBe(true);
    expect(isMp3(Buffer.from([0xff, 0x13]))).toBe(false);
  });
  it('valida imágenes', () => {
    expect(validateUpload('cover', 'a.jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])).ext).toBe('jpg');
    expect(validateUpload('cover', 'a.webp', Buffer.from('RIFF\0\0\0\0WEBPVP8 ')).mime).toBe('image/webp');
    expect(() => validateUpload('cover', 'a.png', Buffer.from('GIF89a'))).toThrow(UploadValidationError);
  });
  it('claves de almacenamiento', () => {
    expect(isValidStorageKey('files/0b8f6a52-3c0e-4c3e-9d63-9d3cbd1f4b7e.pdf')).toBe(true);
    expect(isValidStorageKey('files/../../etc/passwd')).toBe(false);
    expect(isValidStorageKey('/etc/passwd')).toBe(false);
  });
});

describe('miniaturas de portada (2026-11-01)', () => {
  it('parseThumbWidth: sin valor → original; 240/480 → ancho; otros → 400', async () => {
    const { parseThumbWidth } = await import('../src/catalog/thumbnail.service');
    expect(parseThumbWidth(undefined)).toBeUndefined();
    expect(parseThumbWidth('')).toBeUndefined();
    expect(parseThumbWidth('240')).toBe(240);
    expect(parseThumbWidth('480')).toBe(480);
    for (const bad of ['100', '241', '0240', 'abc', '240.0', '-240', ['240', '480'], '24000']) {
      expect(() => parseThumbWidth(bad), String(bad)).toThrow(/Ancho de miniatura no permitido/);
    }
  });
  it('thumbKeyFor deriva una clave válida y rechaza claves que no sean portadas', async () => {
    const { isValidStorageKey, thumbKeyFor } = await import('../src/storage/storage.provider');
    const key = thumbKeyFor('covers/0b8f6a52-3c0e-4c3e-9d63-9d3cbd1f4b7e.png', 240);
    expect(key).toBe('thumbs/0b8f6a52-3c0e-4c3e-9d63-9d3cbd1f4b7e-w240.webp');
    expect(isValidStorageKey(key)).toBe(true);
    expect(isValidStorageKey('thumbs/../covers/x.webp')).toBe(false);
    expect(isValidStorageKey('thumbs/0b8f6a52-3c0e-4c3e-9d63-9d3cbd1f4b7e-w240.png')).toBe(false);
    expect(() => thumbKeyFor('files/0b8f6a52-3c0e-4c3e-9d63-9d3cbd1f4b7e.pdf', 240)).toThrow();
    expect(() => thumbKeyFor('covers/../etc/passwd.png', 240)).toThrow();
  });
});

describe('etagMatches (revalidación condicional, QA 2026-11-01)', () => {
  it('acepta coincidencia exacta, débil, listas y comodín', async () => {
    const { etagMatches } = await import('../src/catalog/file-streamer.service');
    expect(etagMatches('"abc"', 'abc')).toBe(true);
    expect(etagMatches('W/"abc"', 'abc')).toBe(true);
    expect(etagMatches('"x", "abc"', 'abc')).toBe(true);
    expect(etagMatches('*', 'abc')).toBe(true);
    expect(etagMatches('"abcd"', 'abc')).toBe(false);
    expect(etagMatches(undefined, 'abc')).toBe(false);
  });
});
