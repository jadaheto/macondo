'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { scoreMatch, scoreSequence, scoreTrivia, shuffled, type Challenge, type TriviaQuestion } from '@/lib/challenges';

type Finish = (score: number, total: number) => void;

function Header({ challenge }: { challenge: Challenge }) {
  return (
    <>
      <h1 className="text-2xl font-bold">{challenge.title}</h1>
      {challenge.source && <p className="text-xs text-brand-muted">{challenge.source}</p>}
      {challenge.resource && (
        <p className="mt-1 text-sm">
          <Link href={`/recurso/${challenge.resource.id}`} className="inline-flex items-center gap-1 font-semibold text-brand-secondary underline">
            <Icon name="libro" className="h-4 w-4" /> Ver la obra: {challenge.resource.title}
          </Link>
        </p>
      )}
    </>
  );
}

/** Cuestionario de opción múltiple reutilizable (retos, actividad de galería, preguntas de audiobiografías). */
export function TriviaQuiz({ questions, onFinish, idPrefix }: { questions: TriviaQuestion[]; onFinish?: Finish; idPrefix?: string }) {
  const uid = useId().replace(/:/g, '');
  const prefix = idPrefix ?? uid;
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = scoreTrivia(questions, answers);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        onFinish?.(score, questions.length);
      }}
    >
      {questions.map((q, qi) => (
        <fieldset key={qi} className="tarjeta p-4">
          <legend className="px-1 font-semibold text-brand-primary">{qi + 1}. {q.prompt}</legend>
          <div className="mt-2 grid gap-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi;
              const correct = submitted && oi === q.answer;
              const wrong = submitted && chosen && oi !== q.answer;
              return (
                <label key={oi} className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-control border px-3 py-2 transition-colors duration-brand ${correct ? 'border-brand-success-text bg-brand-success-bg' : wrong ? 'border-brand-danger-text bg-brand-danger-bg' : chosen ? 'border-brand-accent bg-brand-info-bg' : 'border-brand-border hover:border-brand-control-hover'}`}>
                  <input type="radio" name={`${prefix}-q${qi}`} className="h-5 w-5 shrink-0 accent-brand-primary" checked={chosen} disabled={submitted} onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))} />
                  <span>{opt}</span>
                  {correct && <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-success-text"><Icon name="check" className="h-4 w-4" />Correcta</span>}
                  {wrong && <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-danger-text"><Icon name="cerrar" className="h-4 w-4" />Revisa</span>}
                </label>
              );
            })}
          </div>
          {submitted && q.explanation && <p className="mt-2 text-sm text-brand-muted">{q.explanation}</p>}
        </fieldset>
      ))}
      {!submitted ? (
        <button type="submit" className="btn-primario" disabled={answers.some((a) => a == null)}>Revisar respuestas</button>
      ) : (
        <div>
          <p role="status" className="text-xl font-bold text-brand-primary">
            Acertaste {score} de {questions.length}. {score === questions.length ? '¡Excelente lectura!' : 'Puedes volver a leer e intentarlo otra vez.'}
          </p>
          <button type="button" className="btn-secundario mt-2" onClick={() => { setAnswers(questions.map(() => null)); setSubmitted(false); }}>
            <Icon name="refrescar" className="h-5 w-5" /> Intentar de nuevo
          </button>
        </div>
      )}
    </form>
  );
}

export function Trivia({ challenge, onFinish }: { challenge: Extract<Challenge, { kind: 'trivia' }>; onFinish: Finish }) {
  return (
    <article>
      <Header challenge={challenge} />
      {challenge.text && <blockquote className="mt-3 rounded-card border border-brand-border border-l-4 border-l-brand-accent bg-brand-surface p-4 leading-relaxed shadow-card">{challenge.text}</blockquote>}
      <TriviaQuiz questions={challenge.questions} onFinish={onFinish} idPrefix={challenge.id} />
    </article>
  );
}

export function Sequence({ challenge, onFinish }: { challenge: Extract<Challenge, { kind: 'sequence' }>; onFinish: Finish }) {
  const [order, setOrder] = useState(() => shuffled(challenge.steps));
  const [submitted, setSubmitted] = useState(false);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };
  const score = scoreSequence(challenge.steps, order);
  return (
    <article>
      <Header challenge={challenge} />
      <p className="mt-2">{challenge.text} Usa las flechas para mover cada suceso.</p>
      <ol className="mt-4 space-y-2">
        {order.map((s, i) => {
          const ok = submitted && challenge.steps[i] === s;
          return (
            <li key={s} className={`tarjeta flex items-center gap-2 p-2 ${submitted ? (ok ? 'border-brand-success-text bg-brand-success-bg' : 'border-brand-danger-text bg-brand-danger-bg') : ''}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-primary">{i + 1}</span>
              <span className="min-w-0 flex-1">{s}</span>
              <button type="button" className="btn-fantasma" onClick={() => move(i, -1)} disabled={submitted || i === 0} aria-label={`Subir: ${s}`}>
                <Icon name="arriba" className="h-6 w-6" />
              </button>
              <button type="button" className="btn-fantasma" onClick={() => move(i, 1)} disabled={submitted || i === order.length - 1} aria-label={`Bajar: ${s}`}>
                <Icon name="abajo" className="h-6 w-6" />
              </button>
            </li>
          );
        })}
      </ol>
      {!submitted ? (
        <button type="button" className="btn-primario mt-4" onClick={() => { setSubmitted(true); onFinish(score, challenge.steps.length); }}>
          Comprobar orden
        </button>
      ) : (
        <div className="mt-4">
          <p role="status" className="text-xl font-bold text-brand-primary">
            {score === challenge.steps.length ? '¡Secuencia perfecta!' : `${score} de ${challenge.steps.length} sucesos están en su lugar.`}
          </p>
          <button type="button" className="btn-secundario mt-2" onClick={() => { setOrder(shuffled(challenge.steps, Date.now() % 1000)); setSubmitted(false); }}>
            <Icon name="refrescar" className="h-5 w-5" /> Intentar de nuevo
          </button>
        </div>
      )}
    </article>
  );
}

/**
 * Relacionar: tocar un elemento de la izquierda y luego su pareja de la derecha (sin arrastrar).
 * Todo son botones (teclado: Tab + Enter/Espacio) y hay un modo alternativo con listas desplegables.
 */
export function Match({ challenge, onFinish }: { challenge: Extract<Challenge, { kind: 'match' }>; onFinish: Finish }) {
  const n = challenge.pairs.length;
  const [seed, setSeed] = useState(11);
  // rightOrder[k] = índice de la pareja original mostrada en la posición k de la columna derecha
  const rightOrder = useMemo(() => shuffled(challenge.pairs.map((_, i) => i), seed), [challenge.pairs, seed]);
  const [attempt, setAttempt] = useState<(number | null)[]>(() => challenge.pairs.map(() => null));
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [useLists, setUseLists] = useState(false);
  const [announce, setAnnounce] = useState('');
  const score = scoreMatch(challenge.pairs, attempt, rightOrder);
  const usedBy = (k: number) => attempt.findIndex((a) => a === k);

  const pair = (left: number, k: number | null) => {
    setAttempt((prev) => prev.map((a, i) => (i === left ? k : a === k && k != null ? null : a)));
    setSelected(null);
    if (k != null) setAnnounce(`Pareja: «${challenge.pairs[left]!.left}» con «${challenge.pairs[rightOrder[k]!]!.right}».`);
    else setAnnounce(`Se quitó la pareja de «${challenge.pairs[left]!.left}».`);
  };

  const pickRight = (k: number) => {
    if (submitted) return;
    if (selected == null) {
      setAnnounce('Primero elige un elemento de la columna izquierda.');
      return;
    }
    pair(selected, k);
  };

  const reset = () => {
    setAttempt(challenge.pairs.map(() => null));
    setSelected(null);
    setSubmitted(false);
    setSeed((s) => s + 7);
    setAnnounce('Reto reiniciado.');
  };

  const leftState = (i: number) => {
    if (!submitted) return '';
    const k = attempt[i];
    return k != null && rightOrder[k] === i ? 'border-brand-success-text bg-brand-success-bg' : 'border-brand-danger-text bg-brand-danger-bg';
  };

  return (
    <article>
      <Header challenge={challenge} />
      {challenge.text && <p className="mt-2">{challenge.text}</p>}
      <p className="mt-1 text-sm text-brand-muted">
        Toca un elemento de la izquierda y después su pareja de la derecha. Puedes cambiar una pareja cuando quieras.
      </p>
      <label className="mt-2 inline-flex min-h-touch items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-brand-primary" checked={useLists} onChange={(e) => setUseLists(e.target.checked)} disabled={submitted} />
        Usar listas desplegables en lugar de tocar
      </label>
      <p className="sr-only" aria-live="polite">{announce}</p>

      {useLists ? (
        <ul className="mt-4 space-y-2">
          {challenge.pairs.map((p, i) => (
            <li key={i} className={`tarjeta flex flex-col gap-2 p-3 sm:flex-row sm:items-center ${leftState(i)}`}>
              <label htmlFor={`${challenge.id}-sel-${i}`} className="flex-1 font-semibold text-brand-primary">{p.left}</label>
              <select
                id={`${challenge.id}-sel-${i}`}
                className="campo sm:max-w-sm"
                value={attempt[i] ?? ''}
                disabled={submitted}
                onChange={(e) => pair(i, e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">— Elige su pareja —</option>
                {rightOrder.map((orig, k) => (
                  <option key={k} value={k}>{challenge.pairs[orig]!.right}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ul className="space-y-2" aria-label="Columna izquierda">
            {challenge.pairs.map((p, i) => {
              const k = attempt[i];
              const isSel = selected === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-pressed={isSel}
                    disabled={submitted}
                    onClick={() => { setSelected(isSel ? null : i); setAnnounce(isSel ? 'Selección cancelada.' : `Elegiste «${p.left}». Ahora elige su pareja.`); }}
                    className={`tarjeta flex min-h-touch-lg w-full flex-col items-start justify-center gap-1 p-3 text-left transition duration-brand ${isSel ? 'border-brand-accent bg-brand-info-bg ring-2 ring-brand-accent' : ''} ${leftState(i)}`}
                  >
                    <span className="font-semibold text-brand-primary">{p.left}</span>
                    {k != null && (
                      <span className="text-sm text-brand-muted">
                        <span className="sr-only">Pareja actual: </span>→ {challenge.pairs[rightOrder[k]!]!.right}
                      </span>
                    )}
                  </button>
                  {k != null && !submitted && (
                    <button type="button" className="btn-fantasma mt-1 text-sm" onClick={() => pair(i, null)} aria-label={`Quitar la pareja de ${p.left}`}>
                      <Icon name="cerrar" className="h-4 w-4" /> Quitar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <ul className="space-y-2" aria-label="Columna derecha">
            {rightOrder.map((orig, k) => {
              const owner = usedBy(k);
              return (
                <li key={k}>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => pickRight(k)}
                    className={`tarjeta flex min-h-touch-lg w-full items-center gap-2 p-3 text-left transition duration-brand ${owner >= 0 ? 'bg-brand-soft' : ''} ${selected != null && !submitted ? 'hover:border-brand-accent' : ''}`}
                  >
                    {owner >= 0 && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-sm font-bold text-brand-on-primary" aria-hidden="true">{owner + 1}</span>}
                    <span>{challenge.pairs[orig]!.right}</span>
                    {owner >= 0 && <span className="sr-only"> (emparejado con {challenge.pairs[owner]!.left})</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!submitted ? (
        <button type="button" className="btn-primario mt-4" disabled={attempt.some((a) => a == null)} onClick={() => { setSubmitted(true); onFinish(score, n); }}>
          Comprobar parejas
        </button>
      ) : (
        <div className="mt-4">
          <p role="status" className="text-xl font-bold text-brand-primary">
            {score === n ? '¡Todas las parejas son correctas!' : `${score} de ${n} parejas son correctas.`}
          </p>
          {score < n && (
            <ul className="mt-2 list-disc pl-6 text-sm text-brand-muted">
              {challenge.pairs.map((p, i) => <li key={i}><strong>{p.left}</strong> → {p.right}</li>)}
            </ul>
          )}
          <button type="button" className="btn-secundario mt-2" onClick={reset}>
            <Icon name="refrescar" className="h-5 w-5" /> Intentar de nuevo
          </button>
        </div>
      )}
    </article>
  );
}

export function ChallengePlayer({ challenge, onFinish }: { challenge: Challenge; onFinish: Finish }) {
  if (challenge.kind === 'trivia') return <Trivia key={challenge.id} challenge={challenge} onFinish={onFinish} />;
  if (challenge.kind === 'sequence') return <Sequence key={challenge.id} challenge={challenge} onFinish={onFinish} />;
  return <Match key={challenge.id} challenge={challenge} onFinish={onFinish} />;
}
