'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canDownloadOffline } from '@macondo/shared';
import { useResource } from '@/components/useResource';
import { Cover } from '@/components/Cover';
import { AvisoParcial, Cargando, ErrorEstado } from '@/components/StateViews';
import { Icon } from '@/components/Icon';
import { OfflineButton } from '@/components/OfflineButton';
import { ResourceChallenges, ResourceExtras } from '@/components/ResourceExtras';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { formatDate, formatDuration, gradeRangeLabel, inaccessibleReasons, primaryAction, typeLabel } from '@/lib/resource';

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error, loading, reload, fromOffline } = useResource(id);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (id) setFav(isFavorite(id));
  }, [id]);

  if (loading && !r) return <Cargando label="Cargando ficha…" />;
  if (error || !r) return <ErrorEstado message={error?.message ?? 'No encontramos este recurso.'} onRetry={reload} />;

  const action = primaryAction(r);
  const reasons = inaccessibleReasons(r);
  const duration = formatDuration(r.durationSeconds);
  const lic = r.license;

  return (
    <article className="grid gap-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[280px]">
        <Cover resource={r} size="large" />
      </div>
      <div>
        <p className="eyebrow">{typeLabel(r.type)}</p>
        <h1 className="mt-1 break-words text-3xl font-bold">{r.title}</h1>
        <p className="mt-1 text-lg text-brand-muted">{r.creator}</p>
        {fromOffline && <div className="mt-2"><AvisoParcial>Mostrando la ficha guardada en este dispositivo (sin conexión).</AvisoParcial></div>}

        {r.accessible ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {action === 'leer' && (
              <Link href={`/leer/${r.id}`} className="btn-primario"><Icon name="libro" className="h-5 w-5" /> Leer</Link>
            )}
            {action === 'escuchar' && (
              <Link href={`/leer/${r.id}`} className="btn-primario"><Icon name="audifonos" className="h-5 w-5" /> Escuchar</Link>
            )}
            {action === 'galeria' && (
              <Link href={`/galeria/${r.id}`} className="btn-primario"><Icon name="galeria" className="h-5 w-5" /> Ver galería</Link>
            )}
            {action === null && <p className="text-brand-muted">El archivo de este recurso aún no está cargado.</p>}
            <button
              type="button"
              className="btn-secundario"
              aria-pressed={fav}
              onClick={() => setFav(toggleFavorite(r.id))}
            >
              <Icon name={fav ? 'corazon-lleno' : 'corazon'} className="h-5 w-5" /> {fav ? 'En favoritos' : 'Agregar a favoritos'}
            </button>
          </div>
        ) : (
          <div role="note" className="mt-4 rounded-card border border-brand-danger-text/30 border-l-4 border-l-brand-danger-text bg-brand-danger-bg p-4">
            <p className="flex items-center gap-2 font-semibold text-brand-danger-text"><Icon name="candado" className="h-5 w-5" /> Este recurso no está disponible por ahora</p>
            <ul className="mt-2 list-disc pl-6 text-brand-text">
              {reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
        )}

        {canDownloadOffline(r) && (
          <div className="mt-4">
            <OfflineButton resource={r} />
          </div>
        )}

        {r.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-brand-text">{r.description}</p>}

        <ResourceExtras resource={r} />
        {!fromOffline && <ResourceChallenges resourceId={r.id} />}

        <dl className="tarjeta mt-6 grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
          <Meta k="Grados" v={gradeRangeLabel(r.gradeMin, r.gradeMax)} />
          <Meta k="Idioma" v={r.language === 'es' ? 'Español' : r.language} />
          {r.narrator && <Meta k="Narración" v={r.narrator} />}
          {duration && <Meta k="Duración" v={duration} />}
          <Meta k="Formato" v={r.format === 'IMAGE_SET' ? 'Galería de imágenes' : r.format === 'NONE' ? 'Sin archivo' : r.format} />
          {r.categories.length > 0 && <Meta k="Categorías" v={r.categories.join(', ')} />}
        </dl>

        <section aria-labelledby="licencia" className="mt-6 rounded-card border border-brand-border bg-brand-soft p-4">
          <h2 id="licencia" className="flex items-center gap-2 text-lg font-bold"><Icon name="candado" className="h-5 w-5 text-brand-secondary" /> Licencia del contenido</h2>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Meta k="Titular de derechos" v={lic.rightsHolder} />
            <Meta
              k="Licencia"
              v={lic.licenseUrl ? <a className="font-semibold text-brand-secondary underline" href={lic.licenseUrl} target="_blank" rel="noopener noreferrer">{lic.licenseName}</a> : lic.licenseName}
            />
            <Meta k="Vigencia" v={`${formatDate(lic.validFrom) ?? 'Sin fecha de inicio'} – ${formatDate(lic.validUntil) ?? 'sin vencimiento declarado'}`} />
            <Meta k="Uso sin conexión" v={lic.offlineAllowed ? 'Permitido' : 'No permitido'} />
            <Meta k="Dispositivos autorizados" v={String(lic.authorizedDevices)} />
            <Meta k="Territorio" v={lic.territory} />
          </dl>
        </section>
      </div>
    </article>
  );
}

function Meta({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-brand-muted">{k}</dt>
      <dd className="break-words">{v}</dd>
    </div>
  );
}
