'use client';

import Link from 'next/link';
import { API_ROUTES, type ChallengeDTO, type Paginated, type ResourceDTO } from '@macondo/shared';
import { useApi } from './useApi';
import { Icon } from './Icon';
import { TriviaQuiz } from './ChallengePlayers';
import { catalogUrl } from '@/lib/api';
import { CHALLENGE_KIND_LABELS } from '@/lib/challenges';
import { findRelated } from '@/lib/resource';

/** Línea de tiempo, datos curiosos / ideas, preguntas y texto narrado (audiobiografías y audioresúmenes). */
export function ResourceExtras({ resource }: { resource: ResourceDTO }) {
  const x = resource.extra;
  const isBio = resource.type === 'AUDIOBIOGRAPHY';
  const isSummary = resource.type === 'AUDIOSUMMARY';
  const related = useApi<Paginated<ResourceDTO>>(isSummary && x?.relatedTitle ? catalogUrl({ q: x.relatedTitle.slice(0, 100), pageSize: 20 }) : null);
  if (!x || (!isBio && !isSummary)) return null;
  const relatedResource = related.data ? findRelated(related.data.items, x.relatedTitle, x.relatedCreator, resource.id) : null;

  return (
    <div className="mt-6 space-y-6">
      {isSummary && x.relatedTitle && (
        <section aria-labelledby="obra-rel" className="tarjeta p-4">
          <h2 id="obra-rel" className="flex items-center gap-2 text-lg font-bold"><Icon name="libro" className="h-5 w-5 text-brand-secondary" /> Obra resumida</h2>
          {relatedResource ? (
            <Link href={`/recurso/${relatedResource.id}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-secondary underline">
              {relatedResource.title} — {relatedResource.creator}
            </Link>
          ) : (
            <p className="mt-1">{x.relatedTitle}{x.relatedCreator ? ` — ${x.relatedCreator}` : ''} <span className="text-sm text-brand-muted">(aún no está en el catálogo)</span></p>
          )}
        </section>
      )}

      {isBio && x.timeline && x.timeline.length > 0 && (
        <section aria-labelledby="linea-tiempo">
          <h2 id="linea-tiempo" className="flex items-center gap-2 text-2xl font-bold"><Icon name="tiempo" className="h-7 w-7 text-brand-secondary" /> Línea de tiempo</h2>
          <ol className="mt-3 border-l-4 border-brand-accent pl-4">
            {[...x.timeline].sort((a, b) => a.year - b.year).map((t, i) => (
              <li key={i} className="relative mb-3">
                <span className="absolute -left-[26px] top-1 h-4 w-4 rounded-full border-2 border-brand-surface bg-brand-accent" aria-hidden="true" />
                <p className="font-bold text-brand-primary">{t.year}</p>
                <p>{t.event}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {x.funFacts && x.funFacts.length > 0 && (
        <section aria-labelledby="datos">
          <h2 id="datos" className="flex items-center gap-2 text-2xl font-bold"><Icon name="bombillo" className="h-7 w-7 text-brand-secondary" /> {isBio ? 'Datos curiosos' : 'Ideas principales'}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {x.funFacts.map((f, i) => <li key={i} className="tarjeta p-3">{f}</li>)}
          </ul>
        </section>
      )}

      {x.questions && x.questions.length > 0 && (
        <section aria-labelledby="preguntas">
          <h2 id="preguntas" className="flex items-center gap-2 text-2xl font-bold"><Icon name="trivia" className="h-7 w-7 text-brand-secondary" /> Preguntas para pensar</h2>
          <TriviaQuiz questions={x.questions} idPrefix={`extra-${resource.id}`} />
        </section>
      )}

      {x.text && (
        <details className="tarjeta p-4">
          <summary className="cursor-pointer font-semibold text-brand-primary">Leer el texto narrado</summary>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{x.text}</p>
        </details>
      )}
    </div>
  );
}

/** Retos activos enlazados a esta obra. */
export function ResourceChallenges({ resourceId }: { resourceId: string }) {
  const { data } = useApi<ChallengeDTO[]>(`${API_ROUTES.challenges}?resourceId=${encodeURIComponent(resourceId)}`);
  if (!data || data.length === 0) return null;
  return (
    <section aria-labelledby="retos-obra" className="mt-6">
      <h2 id="retos-obra" className="flex items-center gap-2 text-2xl font-bold"><Icon name="trofeo" className="h-7 w-7 text-brand-secondary" /> Retos de esta obra</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {data.map((c) => (
          <li key={c.id}>
            <Link href={`/retos?reto=${encodeURIComponent(c.id)}`} className="tarjeta flex min-h-touch-lg items-center gap-3 p-4 transition duration-brand hover:-translate-y-0.5 hover:shadow-card-hover">
              <Icon name="trofeo" className="h-8 w-8 text-brand-accent-strong" />
              <span>
                <span className="block font-semibold text-brand-primary">{c.title}</span>
                <span className="block text-sm text-brand-muted">{CHALLENGE_KIND_LABELS[c.kind]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
