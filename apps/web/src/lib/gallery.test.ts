import { clampZoom, nextIndex, swipeDirection } from './gallery';

describe('visor de galería', () => {
  it('limita el zoom entre 1 y el máximo', () => {
    expect(clampZoom(0.2)).toBe(1);
    expect(clampZoom(9)).toBe(5);
    expect(clampZoom(2.345)).toBe(2.35);
    expect(clampZoom(Number.NaN)).toBe(1);
  });
  it('navega en círculo', () => {
    expect(nextIndex(0, -1, 3)).toBe(2);
    expect(nextIndex(2, 1, 3)).toBe(0);
    expect(nextIndex(0, 1, 0)).toBe(0);
  });
  it('detecta deslizamientos horizontales', () => {
    expect(swipeDirection(-100, 5)).toBe(1);
    expect(swipeDirection(100, 5)).toBe(-1);
    expect(swipeDirection(30, 0)).toBeNull();
    expect(swipeDirection(80, 90)).toBeNull();
  });
});
