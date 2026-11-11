import type { ByteRange } from '../storage/storage.provider';

export type RangeResult = { kind: 'full' } | { kind: 'partial'; range: ByteRange } | { kind: 'unsatisfiable' };

/** Interpreta un encabezado HTTP Range de un único rango (bytes=a-b, bytes=a-, bytes=-n). */
export function parseRange(header: string | undefined, size: number): RangeResult {
  if (!header) return { kind: 'full' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return { kind: 'full' }; // rangos múltiples o sintaxis desconocida: se sirve completo (RFC 9110 lo permite)
  const [, a, b] = m;
  if (a === '' && b === '') return { kind: 'unsatisfiable' };
  let start: number;
  let end: number;
  if (a === '') {
    const suffix = Number(b);
    if (suffix === 0) return { kind: 'unsatisfiable' };
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) {
    return { kind: 'unsatisfiable' };
  }
  return { kind: 'partial', range: { start, end } };
}
