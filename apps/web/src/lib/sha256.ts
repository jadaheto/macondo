/** Verificación de integridad con SubtleCrypto (disponible solo en contextos seguros: https o localhost). */

function getSubtle(subtle?: SubtleCrypto): SubtleCrypto {
  const s = subtle ?? (typeof globalThis !== 'undefined' ? globalThis.crypto?.subtle : undefined);
  if (!s) {
    throw new Error(
      'SubtleCrypto no está disponible (requiere https o localhost). No se puede verificar la integridad del archivo.',
    );
  }
  return s;
}

export function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, '0');
  return out;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array, subtle?: SubtleCrypto): Promise<string> {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Copia a un ArrayBuffer propio (evita SharedArrayBuffer / offsets).
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  const digest = await getSubtle(subtle).digest('SHA-256', copy.buffer);
  return bufferToHex(digest);
}

export function normalizeHash(h: string): string {
  return h.trim().toLowerCase().replace(/^sha256[:-]/, '');
}

/** true si el hash SHA-256 del contenido coincide con el esperado (hex, sin distinguir mayúsculas). */
export async function verifySha256(data: ArrayBuffer | Uint8Array, expected: string, subtle?: SubtleCrypto): Promise<boolean> {
  if (!expected || !/^[0-9a-f]{64}$/.test(normalizeHash(expected))) return false;
  const actual = await sha256Hex(data, subtle);
  return actual === normalizeHash(expected);
}
