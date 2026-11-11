import { CHALLENGES, loadProgress, recordResult, scoreSequence, scoreTrivia, shuffled } from './challenges';

describe('retos lectores', () => {
  beforeEach(() => localStorage.clear());
  it('puntúa trivia y secuencias', () => {
    const trivia = CHALLENGES.find((c) => c.kind === 'trivia')!;
    if (trivia.kind !== 'trivia') throw new Error();
    expect(scoreTrivia(trivia.questions, trivia.questions.map((q) => q.answer))).toBe(trivia.questions.length);
    expect(scoreTrivia(trivia.questions, trivia.questions.map(() => null))).toBe(0);
    expect(scoreSequence(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(1);
  });
  it('la mezcla nunca deja la secuencia ya resuelta', () => {
    const steps = ['1', '2', '3', '4'];
    for (let seed = 0; seed < 50; seed++) expect(shuffled(steps, seed)).not.toEqual(steps);
  });
  it('otorga insignias locales sin datos personales', () => {
    const [a, b, c] = CHALLENGES;
    let r = recordResult(a!, 3, 3);
    expect(r.newBadges.map((x) => x.id)).toEqual(expect.arrayContaining(['primer-reto', 'trivia-perfecta']));
    r = recordResult(b!, 4, 4);
    expect(r.newBadges.map((x) => x.id)).toContain('secuencia-maestra');
    r = recordResult(c!, 1, 3);
    expect(r.newBadges.map((x) => x.id)).toContain('lector-constante');
    expect(loadProgress().badges).toHaveLength(4);
    expect(JSON.stringify(loadProgress())).not.toMatch(/nombre|name/i);
  });
});

import { resolveChallenges, scoreMatch, splitByBand, CHALLENGES as BUILTIN, type Challenge } from './challenges';

describe('retos: relacionar, bandas y fuente de datos', () => {
  beforeEach(() => localStorage.clear());
  const pairs = [{ left: 'a', right: '1' }, { left: 'b', right: '2' }, { left: 'c', right: '3' }];
  it('puntúa parejas según el orden mostrado a la derecha', () => {
    const rightOrder = [2, 0, 1]; // posición k muestra la pareja original rightOrder[k]
    expect(scoreMatch(pairs, [1, 2, 0], rightOrder)).toBe(3);
    expect(scoreMatch(pairs, [0, 2, 1], rightOrder)).toBe(1);
    expect(scoreMatch(pairs, [null, null, null], rightOrder)).toBe(0);
  });
  it('relacionar perfecto otorga «Gran conector»', () => {
    const m: Challenge = { id: 'm', kind: 'match', title: 'm', source: '', bands: ['1-3'], text: '', pairs };
    expect(recordResult(m, 3, 3).newBadges.map((b) => b.id)).toContain('gran-conector');
  });
  it('separa por banda de grado', () => {
    const r = splitByBand(BUILTIN, '9-11');
    expect(r.recommended.every((c) => c.bands.includes('9-11'))).toBe(true);
    expect(r.recommended.length + r.others.length).toBe(BUILTIN.length);
    expect(splitByBand(BUILTIN, null).others).toHaveLength(0);
  });
  it('API con datos → api (y guarda copia); API vacía → incorporados; sin red → copia local', async () => {
    const remote = [{ id: 'r1', kind: 'match', title: 'R', source: '', bands: ['4-5'], text: '', pairs, resource: null }, { id: 'roto', kind: 'otro' }];
    const a = await resolveChallenges(async () => remote);
    expect(a.source).toBe('api');
    expect(a.items.map((c) => c.id)).toEqual(['r1']);
    const offline = await resolveChallenges(async () => { throw new Error('sin red'); });
    expect(offline).toMatchObject({ source: 'cache' });
    expect(offline.items[0]!.id).toBe('r1');
    expect((await resolveChallenges(async () => [])).source).toBe('builtin');
    localStorage.clear();
    const none = await resolveChallenges(async () => { throw new Error('x'); });
    expect(none.source).toBe('builtin');
    expect(none.items).toBe(BUILTIN);
  });
});
