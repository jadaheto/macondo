import { readJSON, writeJSON } from './storage';
import type { GradeBand } from './gradeBand';
import type { ChallengeDTO, MatchPair } from '@macondo/shared';

/**
 * Retos lectores de demostración. Los textos son paráfrasis breves de fábulas de Esopo
 * (dominio público) y un texto original escrito para la demo. Sin datos personales; el progreso
 * e insignias se guardan solo en este dispositivo. No hay rankings ni comparaciones entre estudiantes.
 */
export interface TriviaQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export type { MatchPair };
/** Obra del catálogo relacionada (solo si está publicada). */
export type ChallengeResourceRef = ChallengeDTO['resource'];
type Common = { id: string; title: string; source: string; bands: GradeBand[]; text: string; resource?: ChallengeResourceRef };
export type Challenge =
  | (Common & { kind: 'trivia'; questions: TriviaQuestion[] })
  | (Common & { kind: 'sequence'; steps: string[] })
  | (Common & { kind: 'match'; pairs: MatchPair[] });

export const CHALLENGE_KIND_LABELS: Record<Challenge['kind'], string> = {
  trivia: 'Trivia',
  sequence: 'Ordena la secuencia',
  match: 'Relaciona',
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'liebre-tortuga-trivia',
    kind: 'trivia',
    title: 'La liebre y la tortuga',
    source: 'Fábula de Esopo (dominio público), versión breve.',
    bands: ['1-3', '4-5'],
    text:
      'Una liebre se burlaba de lo lenta que era la tortuga. La tortuga la retó a una carrera. La liebre salió muy rápido y, ' +
      'segura de ganar, se acostó a dormir bajo un árbol. La tortuga siguió caminando sin parar. Cuando la liebre despertó, ' +
      'la tortuga ya estaba cruzando la meta.',
    questions: [
      { prompt: '¿Quién retó a quién a una carrera?', options: ['La liebre a la tortuga', 'La tortuga a la liebre', 'El árbol a la liebre'], answer: 1, explanation: 'La tortuga fue quien propuso la carrera.' },
      { prompt: '¿Qué hizo la liebre en mitad de la carrera?', options: ['Se durmió', 'Ayudó a la tortuga', 'Se perdió'], answer: 0, explanation: 'Se confió y se acostó a dormir.' },
      { prompt: '¿Qué nos enseña la fábula?', options: ['Correr es lo más importante', 'La constancia vence a la confianza excesiva', 'Hay que dormir mucho'], answer: 1, explanation: 'Paso a paso y sin rendirse también se llega.' },
    ],
  },
  {
    id: 'liebre-tortuga-secuencia',
    kind: 'sequence',
    title: 'Ordena la carrera',
    source: 'Fábula de Esopo (dominio público).',
    bands: ['1-3', '4-5', '6-8'],
    text: 'Pon los sucesos de “La liebre y la tortuga” en el orden en que ocurrieron.',
    steps: [
      'La liebre se burla de la tortuga.',
      'La tortuga propone una carrera.',
      'La liebre se duerme bajo un árbol.',
      'La tortuga cruza la meta.',
    ],
  },
  {
    id: 'cigarra-hormiga-trivia',
    kind: 'trivia',
    title: 'La cigarra y la hormiga',
    source: 'Fábula de Esopo (dominio público), versión breve.',
    bands: ['4-5', '6-8'],
    text:
      'Durante todo el verano la cigarra cantó y descansó, mientras la hormiga guardaba granos para el invierno. ' +
      'Cuando llegó el frío, la cigarra no tenía qué comer y fue a pedir ayuda a la hormiga.',
    questions: [
      { prompt: '¿Qué hacía la hormiga en verano?', options: ['Cantaba', 'Guardaba comida', 'Dormía'], answer: 1, explanation: 'Se preparaba para el invierno.' },
      { prompt: '¿Por qué la cigarra pidió ayuda?', options: ['Porque no se preparó para el invierno', 'Porque perdió su casa', 'Porque estaba aburrida'], answer: 0, explanation: 'No guardó alimento a tiempo.' },
      { prompt: '¿Cuál es una idea principal del texto?', options: ['Prever el futuro es importante', 'El verano es mejor que el invierno', 'Las hormigas cantan bien'], answer: 0, explanation: 'La fábula valora la previsión.' },
    ],
  },
  {
    id: 'lectura-critica-rio',
    kind: 'trivia',
    title: 'Lectura crítica: el río y la memoria',
    source: 'Texto original de demostración escrito para Macondo Digital.',
    bands: ['6-8', '9-11'],
    text:
      'En muchos pueblos de la región, el río no es solo una fuente de agua: es el lugar donde se cuentan historias, se ' +
      'comercia y se celebra. Cuando un río se contamina, no solo se pierde un recurso natural; también se debilita una ' +
      'parte de la memoria colectiva. Por eso, cuidar el río es también una forma de cuidar la cultura.',
    questions: [
      { prompt: '¿Cuál es la tesis principal del texto?', options: ['Los ríos sirven para comerciar', 'Cuidar el río implica cuidar la cultura', 'La contaminación es inevitable'], answer: 1, explanation: 'La última oración resume la postura del autor.' },
      { prompt: '¿Qué función cumple la expresión “no solo… también”?', options: ['Contrastar dos ideas opuestas', 'Ampliar el sentido agregando una dimensión nueva', 'Presentar un ejemplo numérico'], answer: 1, explanation: 'Suma la dimensión cultural a la natural.' },
      { prompt: '¿Qué se puede inferir del texto?', options: ['Para el autor el río tiene valor simbólico', 'El autor vive junto a un río', 'Todos los ríos están contaminados'], answer: 0, explanation: 'Se infiere del vínculo río–memoria; lo demás no está en el texto.' },
    ],
  },
];

export interface Badge {
  id: string;
  name: string;
  description: string;
}
export const BADGES: Badge[] = [
  { id: 'primer-reto', name: 'Primer vuelo', description: 'Completaste tu primer reto.' },
  { id: 'trivia-perfecta', name: 'Mariposa sabia', description: 'Respondiste bien todas las preguntas de una trivia.' },
  { id: 'secuencia-maestra', name: 'Tejedor de historias', description: 'Ordenaste una secuencia completa.' },
  { id: 'lector-constante', name: 'Lector constante', description: 'Completaste tres retos distintos.' },
  { id: 'gran-conector', name: 'Gran conector', description: 'Relacionaste correctamente todas las parejas de un reto.' },
];

export interface ChallengeProgress {
  completed: Record<string, { best: number; total: number }>;
  badges: string[];
}
const KEY = 'macondo.challenges';

export function loadProgress(): ChallengeProgress {
  const v = readJSON<Partial<ChallengeProgress> | null>(KEY, null);
  return {
    completed: v?.completed && typeof v.completed === 'object' ? v.completed : {},
    badges: Array.isArray(v?.badges) ? v!.badges : [],
  };
}

export function scoreTrivia(questions: TriviaQuestion[], answers: (number | null)[]): number {
  return questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
}

/** Cuántos elementos están en su posición correcta. */
export function scoreSequence(correct: string[], attempt: string[]): number {
  return correct.reduce((acc, s, i) => acc + (attempt[i] === s ? 1 : 0), 0);
}

/** Registra resultado y devuelve insignias nuevas (función casi pura: lee/escribe progreso). */
export function recordResult(challenge: Challenge, score: number, total: number, progress = loadProgress()): { progress: ChallengeProgress; newBadges: Badge[] } {
  const prev = progress.completed[challenge.id];
  const completed = { ...progress.completed, [challenge.id]: { best: Math.max(prev?.best ?? 0, score), total } };
  const earned = new Set(progress.badges);
  const before = new Set(earned);
  earned.add('primer-reto');
  if (challenge.kind === 'trivia' && score === total) earned.add('trivia-perfecta');
  if (challenge.kind === 'sequence' && score === total) earned.add('secuencia-maestra');
  if (challenge.kind === 'match' && score === total) earned.add('gran-conector');
  if (Object.keys(completed).length >= 3) earned.add('lector-constante');
  const next: ChallengeProgress = { completed, badges: [...earned] };
  writeJSON(KEY, next);
  return { progress: next, newBadges: BADGES.filter((b) => earned.has(b.id) && !before.has(b.id)) };
}

/** Mezcla determinista para que la secuencia no empiece ya ordenada. */
export function shuffled<T>(items: T[], seed = 7): T[] {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  if (a.every((x, i) => x === items[i]) && a.length > 1) [a[0], a[1]] = [a[1]!, a[0]!];
  return a;
}

/** Parejas correctas: `attempt[i]` es el índice de la derecha elegido para la izquierda `i`. */
export function scoreMatch(pairs: MatchPair[], attempt: (number | null)[], rightOrder: number[]): number {
  return pairs.reduce((acc, _p, i) => {
    const chosen = attempt[i];
    return acc + (chosen != null && rightOrder[chosen] === i ? 1 : 0);
  }, 0);
}

/** Separa recomendados (banda actual) del resto. Sin banda elegida: todos son recomendados. */
export function splitByBand<T extends { bands: GradeBand[] }>(items: T[], band: GradeBand | null): { recommended: T[]; others: T[] } {
  if (!band) return { recommended: items, others: [] };
  return { recommended: items.filter((c) => c.bands.includes(band)), others: items.filter((c) => !c.bands.includes(band)) };
}

const CACHE_KEY = 'macondo.challenges.cache';
/** Valida mínimamente lo que llega de la API (o de la copia local) antes de mostrarlo. */
function isPlayable(c: unknown): c is Challenge {
  if (!c || typeof c !== 'object') return false;
  const x = c as Record<string, unknown>;
  if (typeof x.id !== 'string' || typeof x.title !== 'string' || !Array.isArray(x.bands)) return false;
  if (x.kind === 'trivia') return Array.isArray(x.questions) && x.questions.length > 0;
  if (x.kind === 'sequence') return Array.isArray(x.steps) && x.steps.length > 1;
  if (x.kind === 'match') return Array.isArray(x.pairs) && x.pairs.length > 1;
  return false;
}

export type ChallengeSource = 'api' | 'cache' | 'builtin';
/**
 * Fuente de retos: API → copia local de la última respuesta (sin conexión) → retos incorporados.
 * `fetcher` devuelve el arreglo de la API o lanza si no hay conexión.
 */
export async function resolveChallenges(fetcher: () => Promise<unknown>): Promise<{ items: Challenge[]; source: ChallengeSource }> {
  try {
    const data = await fetcher();
    const items = Array.isArray(data) ? data.filter(isPlayable) : [];
    if (items.length > 0) {
      writeJSON(CACHE_KEY, items);
      return { items, source: 'api' };
    }
    return { items: CHALLENGES, source: 'builtin' }; // API vacía
  } catch {
    const cached = readJSON<unknown>(CACHE_KEY, null);
    const items = Array.isArray(cached) ? cached.filter(isPlayable) : [];
    return items.length ? { items, source: 'cache' } : { items: CHALLENGES, source: 'builtin' };
  }
}
