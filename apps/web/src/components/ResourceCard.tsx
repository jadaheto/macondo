import Link from 'next/link';
import type { ResourceDTO } from '@macondo/shared';
import { gradeRangeLabel, typeLabel } from '@/lib/resource';
import { Cover } from './Cover';

export function ResourceCard({ resource, compact = false }: { resource: ResourceDTO; compact?: boolean }) {
  return (
    <li className="min-w-0 list-none">
      <Link
        href={`/recurso/${resource.id}`}
        className="tarjeta group flex h-full min-w-0 flex-col gap-2 p-3 transition duration-brand hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:shadow-card-hover"
      >
        <Cover resource={resource} />
        <span className="eyebrow mt-1 text-xs">{typeLabel(resource.type)}</span>
        <span className="break-words text-lg font-bold leading-snug text-brand-primary group-hover:underline">{resource.title}</span>
        <span className="text-sm text-brand-muted">{resource.creator}</span>
        {!compact && (
          <span className="mt-auto inline-flex w-fit rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-secondary">
            Grados {gradeRangeLabel(resource.gradeMin, resource.gradeMax)}
          </span>
        )}
      </Link>
    </li>
  );
}
