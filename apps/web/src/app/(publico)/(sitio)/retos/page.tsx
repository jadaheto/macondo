'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES } from '@macondo/shared';
import { useGradeBand } from '@/components/GradeBandProvider';
import { Icon } from '@/components/Icon';
import { ChallengePlayer } from '@/components/ChallengePlayers';
import { apiFetch } from '@/lib/api';
import {
  BADGES, CHALLENGE_KIND_LABELS, CHALLENGES, loadProgress, recordResult, resolveChallenges, splitByBand,
  type Badge, type Challenge, type ChallengeProgress, type ChallengeSource,
} from '@/lib/challenges';

const KIND_STYLE: Record<Challenge['kind'], { bg: string; icon: 'trivia' | 'ordenar' | 'indice' }> = {
  trivia: { bg: 'bg-brand-accent-strong', icon: 'trivia' },
  sequence: { bg: 'bg-brand-secondary', icon: 'ordenar' },
  match: { bg: 'bg-brand-primary', icon: 'indice' },
};

export default function RetosPage() {
  const { band, config } = useGradeBand();
  const [progress, setProgress] = useState<ChallengeProgress>({ completed: {}, badges: [] });
  const [active, setActive] = useState<Challenge | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [items, setItems] = useState<Challenge[]>(CHALLENGES);
  const [source, setSource] = useState<ChallengeSource | null>(null);

  useEffect(() => setProgress(loadProgress()), []);

  useEffect(() => {
    let alive = true;
    resolveChallenges(() => apiFetch<unknown>(API_ROUTES.challenges, { timeoutMs: 8000 })).then((r) => {
      if (!alive) return;
      setItems(r.items);
      setSource(r.source);
      // Enlace directo: /retos?reto=<id> (desde la ficha de una obra)
      const wanted = new URLSearchParams(window.location.search).get('reto');
      const found = wanted ? r.items.find((c) => c.id === wanted) : undefined;
      if (found) setActive(found);
    });
    return () => {
      alive = false;
    };
  }, []);

  const { recommended, others } = splitByBand(items, band);

  const finish = (c: Challenge, score: number, total: number) => {
    const res = recordResult(c, score, total);
    setProgress(res.progress);
    setNewBadges(res.newBadges);
  };

  if (active) {
    return (
      <div className="mx-auto max-w-3xl">
        <button type="button" className="btn-fantasma -ml-3" onClick={() => { setActive(null); setNewBadges([]); }}>
          <Icon name="volver" className="h-5 w-5" /> Volver a los retos
        </button>
        <ChallengePlayer key={active.id} challenge={active} onFinish={(s, t) => finish(active, s, t)} />
        {newBadges.length > 0 && (
          <div role="status" className="mt-4 flex gap-3 rounded-card border border-brand-positive bg-brand-success-bg p-4 text-brand-text">
            <Icon name="medalla" className="h-8 w-8 text-brand-success-text" />
            <div>
            <p className="text-lg font-bold text-brand-success-text">¡Nueva insignia!</p>
            <ul>{newBadges.map((b) => <li key={b.id}><strong>{b.name}:</strong> {b.description}</li>)}</ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">{band ? `Grados ${config.label}` : 'Biblioteca Macondo'}</p>
      <h1 className="mt-1 text-3xl font-bold">Retos lectores</h1>
      <p className="mt-1 text-brand-text">{config.challengeIntro}</p>
      <p className="mt-1 text-sm text-brand-muted">Tu progreso se guarda solo en este dispositivo. No hay tablas de posiciones: cada lector avanza a su ritmo.</p>
      {source === 'cache' && <p className="mt-1 text-sm text-brand-muted">Sin conexión: mostramos los retos guardados en este dispositivo.</p>}
      {source === 'builtin' && <p className="mt-1 text-sm text-brand-muted">Mostrando los retos incorporados de la biblioteca.</p>}

      <ChallengeList title={band ? 'Recomendados para tu grado' : 'Retos'} items={recommended} progress={progress} onOpen={setActive} />
      {others.length > 0 && <ChallengeList title="Otros retos" items={others} progress={progress} onOpen={setActive} />}

      <section aria-labelledby="insignias" className="mt-8">
        <h2 id="insignias" className="flex items-center gap-2 text-2xl font-bold"><Icon name="medalla" className="h-7 w-7 text-brand-secondary" /> Mis insignias</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const has = progress.badges.includes(b.id);
            return (
              <li key={b.id} className={`tarjeta p-3 text-center ${has ? 'border-brand-positive' : 'bg-brand-soft shadow-none'}`}>
                <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${has ? 'bg-brand-success-bg text-brand-success-text' : 'bg-brand-surface text-brand-muted'}`}>
                  <Icon name={has ? 'medalla' : 'candado'} className="h-8 w-8" />
                </span>
                <p className="mt-2 font-semibold text-brand-primary">{b.name}</p>
                <p className="text-xs text-brand-muted">{has ? b.description : `Por ganar: ${b.description}`}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ChallengeList({ title, items, progress, onOpen }: { title: string; items: Challenge[]; progress: ChallengeProgress; onOpen: (c: Challenge) => void }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {items.map((c) => {
          const done = progress.completed[c.id];
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c)} className="tarjeta flex min-h-touch-lg w-full items-center gap-3 p-4 text-left transition duration-brand hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:shadow-card-hover">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-brand-on-primary ${KIND_STYLE[c.kind].bg}`}>
                  <Icon name={KIND_STYLE[c.kind].icon} className="h-7 w-7" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-brand-primary">{c.title}</span>
                  <span className="block text-sm text-brand-muted">
                    {CHALLENGE_KIND_LABELS[c.kind]}{done ? ` · Mejor resultado: ${done.best}/${done.total}` : ''}
                  </span>
                  {c.resource && <span className="block text-xs text-brand-muted">Obra: {c.resource.title}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
