import type { TvSlideDTO } from '@macondo/shared';
import { createSlideRotator, FALLBACK_SLIDES, nextIndex, resolveSchedule, slideDurationMs, validSlides, animationsDisabled } from './tvRotation';

const slide = (id: string, order: number, durationSeconds: number, extra: Partial<TvSlideDTO> = {}): TvSlideDTO => ({
  id, kind: 'MESSAGE', title: `Diapositiva ${id}`, body: '', order, durationSeconds, active: true, ...extra,
});

describe('rotación de Macondo TV', () => {
  afterEach(() => vi.useRealTimers());

  it('cada diapositiva dura su durationSeconds', () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const rot = createSlideRotator([slide('a', 0, 5), slide('b', 1, 10), slide('c', 2, 3)], (_, s) => seen.push(s.id));
    rot.start();
    expect(seen).toEqual(['a']);
    vi.advanceTimersByTime(4_999);
    expect(seen).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(['a', 'b']);
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual(['a', 'b', 'c']);
    vi.advanceTimersByTime(3_000);
    expect(seen).toEqual(['a', 'b', 'c', 'a']);
    rot.stop();
    vi.advanceTimersByTime(60_000);
    expect(seen).toHaveLength(4);
  });

  it('setSlides conserva la diapositiva actual si sigue existiendo', () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const rot = createSlideRotator([slide('a', 0, 5), slide('b', 1, 5)], (_, s) => seen.push(s.id));
    rot.start();
    vi.advanceTimersByTime(5_000); // b
    rot.setSlides([slide('x', 0, 5), slide('b', 1, 5)]);
    expect(rot.current()).toBe(1);
    rot.setSlides([slide('z', 0, 5)]);
    expect(rot.current()).toBe(0);
    expect(seen.at(-1)).toBe('z');
  });

  it('duración por defecto y límites', () => {
    expect(slideDurationMs({ durationSeconds: 20 })).toBe(20_000);
    expect(slideDurationMs({ durationSeconds: 1 })).toBe(20_000); // por defecto 20 s
    expect(slideDurationMs({ durationSeconds: 9999 })).toBe(600_000);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 0)).toBe(0);
  });

  it('filtra inactivas y fuera de vigencia, y ordena', () => {
    const now = new Date('2026-10-31T12:00:00Z');
    const list = validSlides(
      [
        slide('b', 2, 5),
        slide('a', 1, 5),
        slide('off', 0, 5, { active: false }),
        slide('futura', 0, 5, { startsAt: '2026-11-01T00:00:00Z' }),
        slide('vencida', 0, 5, { endsAt: '2026-10-30T00:00:00Z' }),
        { basura: true },
      ],
      now,
    );
    expect(list.map((s) => s.id)).toEqual(['a', 'b']);
    expect(validSlides('no es arreglo')).toEqual([]);
  });

  it('respaldo: en vivo → caché → institucional', () => {
    const live = [slide('l', 0, 5)];
    const cached = [slide('c', 0, 5)];
    expect(resolveSchedule(live, cached)).toEqual({ slides: live, source: 'live' });
    expect(resolveSchedule(null, cached)).toEqual({ slides: cached, source: 'cache' });
    expect(resolveSchedule(null, null)).toEqual({ slides: FALLBACK_SLIDES, source: 'fallback' });
    expect(resolveSchedule([], cached).source).toBe('fallback');
  });
});

import { blockOf, bodyLines, buildRail, cycleDurationMs, publicOrigin, slideProgress, splitAgendaLine } from './tvRotation';
import { TV_BLOCKS } from '@macondo/shared';

describe('programación de 6 bloques × 20 s', () => {
  afterEach(() => vi.useRealTimers());
  const kinds = ['BOOK_OF_WEEK', 'AGENDA', 'FUN_FACT', 'FEATURED_AUTHOR', 'CHALLENGE', 'TUTORIAL'] as const;
  const six = kinds.map((kind, i) => slide(`b${i}`, i, 20, { kind }));

  it('rota los 6 bloques en orden, 20 s cada uno, y vuelve al inicio (ciclo de 120 s)', () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const rot = createSlideRotator(validSlides([...six].reverse()), (_, s) => seen.push(s.kind));
    rot.start();
    for (let i = 0; i < 6; i++) vi.advanceTimersByTime(20_000);
    expect(seen).toEqual([...kinds, 'BOOK_OF_WEEK']);
    expect(cycleDurationMs(six)).toBe(120_000);
    rot.stop();
  });

  it('el rail siempre lista los 6 bloques en orden y marca el que está EN PANTALLA', () => {
    const rail = buildRail(six, 3);
    expect(rail.map((r) => r.block)).toEqual([...TV_BLOCKS]);
    expect(rail.filter((r) => r.onAir).map((r) => r.block)).toEqual(['FEATURED_AUTHOR']);
    expect(rail.every((r) => r.slides.length === 1)).toBe(true);
    const partial = buildRail([slide('m', 0, 20, { kind: 'MESSAGE' }), slide('g', 1, 20, { kind: 'GALLERY' })], 1);
    expect(partial).toHaveLength(6);
    expect(partial.find((r) => r.onAir)?.block).toBe('FUN_FACT');
    expect(partial.find((r) => r.block === 'AGENDA')?.slides.map((s) => s.id)).toEqual(['m']);
    expect(partial.find((r) => r.block === 'TUTORIAL')?.slides).toEqual([]);
  });

  it('avance de 0 a 1 en 20 s', () => {
    expect(slideProgress(1000, 1000, 20_000)).toBe(0);
    expect(slideProgress(1000, 11_000, 20_000)).toBe(0.5);
    expect(slideProgress(1000, 99_000, 20_000)).toBe(1);
    expect(slideProgress(1000, 0, 20_000)).toBe(0);
    expect(slideProgress(1000, 2000, 0)).toBe(0);
  });

  it('cada tipo cae en un bloque; respaldo intacto cuando la API falla', () => {
    expect(blockOf('TUTORIAL')).toBe('TUTORIAL');
    expect(blockOf('GALLERY')).toBe('FUN_FACT');
    expect(blockOf('DESCONOCIDO')).toBe('AGENDA');
    expect(resolveSchedule(null, six).source).toBe('cache');
    expect(resolveSchedule(null, null).slides).toBe(FALLBACK_SLIDES);
    expect(FALLBACK_SLIDES.every((s) => s.durationSeconds === 20)).toBe(true);
  });

  it('origen público de los QR y formato del texto', () => {
    expect(publicOrigin('?origin=http://192.168.1.20:3100/x', undefined, 'http://localhost:3100')).toBe('http://192.168.1.20:3100');
    expect(publicOrigin('', 'https://biblioteca.example.org', 'http://localhost:3100')).toBe('https://biblioteca.example.org');
    expect(publicOrigin('?origin=javascript:alert(1)', undefined, 'http://localhost:3100')).toBe('http://localhost:3100');
    expect(bodyLines(' a \n\n b\r\n')).toEqual(['a', 'b']);
    expect(splitAgendaLine('Hora del cuento – sábados 10:00 a. m.')).toEqual({ what: 'Hora del cuento', when: 'sábados 10:00 a. m.' });
    expect(splitAgendaLine('Club de lectura')).toEqual({ what: 'Club de lectura', when: null });
  });
});

describe('animaciones de la TV', () => {
  it('?animaciones=0 (y no/false/off) desactiva; ausente o 1 mantiene', () => {
    expect(animationsDisabled('?animaciones=0')).toBe(true);
    expect(animationsDisabled('?origin=http://x&animaciones=no')).toBe(true);
    expect(animationsDisabled('?animaciones=OFF')).toBe(true);
    expect(animationsDisabled('?animaciones=1')).toBe(false);
    expect(animationsDisabled('')).toBe(false);
  });
});
