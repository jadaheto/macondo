/** Utilidades puras del visor de galerías (probadas en gallery.test.ts). */
export function clampZoom(z: number, max = 5): number {
  if (!Number.isFinite(z)) return 1;
  return Math.round(Math.min(max, Math.max(1, z)) * 100) / 100;
}

/** Navegación circular. */
export function nextIndex(i: number, d: 1 | -1, n: number): number {
  if (n <= 0) return 0;
  return (i + d + n) % n;
}

/** Deslizamiento horizontal claro (≥ 60 px y más horizontal que vertical): 1 = siguiente, -1 = anterior. */
export function swipeDirection(dx: number, dy: number, threshold = 60): 1 | -1 | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  return dx < 0 ? 1 : -1;
}
