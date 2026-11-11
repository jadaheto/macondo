import { webcrypto } from 'node:crypto';
import { sha256Hex, verifySha256 } from './sha256';

const subtle = (globalThis.crypto?.subtle ?? webcrypto.subtle) as SubtleCrypto;
const enc = (s: string) => new TextEncoder().encode(s);
// sha256("abc")
const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('verificación SHA-256', () => {
  it('calcula el hash conocido de "abc"', async () => {
    expect(await sha256Hex(enc('abc'), subtle)).toBe(ABC);
  });
  it('acepta mayúsculas y prefijo sha256:', async () => {
    expect(await verifySha256(enc('abc'), ABC.toUpperCase(), subtle)).toBe(true);
    expect(await verifySha256(enc('abc'), `sha256:${ABC}`, subtle)).toBe(true);
  });
  it('rechaza contenido alterado', async () => {
    expect(await verifySha256(enc('abd'), ABC, subtle)).toBe(false);
  });
  it('rechaza hashes vacíos o mal formados sin lanzar', async () => {
    expect(await verifySha256(enc('abc'), '', subtle)).toBe(false);
    expect(await verifySha256(enc('abc'), 'xyz', subtle)).toBe(false);
  });
  it('funciona con ArrayBuffer y con vistas con desplazamiento', async () => {
    const big = enc('__abc__');
    const view = big.subarray(2, 5);
    expect(await sha256Hex(view, subtle)).toBe(ABC);
    expect(await sha256Hex(enc('abc').buffer as ArrayBuffer, subtle)).toBe(ABC);
  });
  it('error claro si no hay SubtleCrypto (contexto no seguro)', async () => {
    vi.stubGlobal('crypto', {});
    try {
      await expect(sha256Hex(enc('abc'))).rejects.toThrow(/SubtleCrypto no está disponible/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
