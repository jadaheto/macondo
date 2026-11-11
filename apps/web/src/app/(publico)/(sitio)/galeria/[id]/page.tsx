'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_ROUTES, canDownloadOffline, type GalleryDTO } from '@macondo/shared';
import { useResource } from '@/components/useResource';
import { useApi } from '@/components/useApi';
import { AvisoParcial, Cargando, ErrorEstado } from '@/components/StateViews';
import { Icon } from '@/components/Icon';
import { GalleryViewer } from '@/components/GalleryViewer';
import { OfflineButton } from '@/components/OfflineButton';
import { inaccessibleReasons } from '@/lib/resource';

/**
 * Galería interactiva (IMAGE_SET): cuadrícula + visor con zoom (pellizco, rueda, botones), navegación
 * por deslizamiento/teclado, pie de foto, créditos y licencia por imagen, y actividad final.
 * Sin conexión: el service worker sirve el JSON y las imágenes desde la caché offline (verificadas con SHA-256).
 */
export default function GalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error, loading, reload, fromOffline } = useResource(id);
  const canLoad = !!r && r.accessible && r.format === 'IMAGE_SET';
  const g = useApi<GalleryDTO>(canLoad ? API_ROUTES.resourceGallery(r.id) : null);

  if (loading && !r) return <Cargando />;
  if (error || !r) return <ErrorEstado message={error?.message ?? 'No encontramos esta galería.'} onRetry={reload} />;
  if (!r.accessible) return <ErrorEstado title="Galería no disponible" message={inaccessibleReasons(r).join(' ')} />;

  return (
    <div>
      <Link href={`/recurso/${r.id}`} className="btn-fantasma -ml-3"><Icon name="volver" className="h-5 w-5" /> Volver a la ficha</Link>
      <p className="eyebrow">Galería interactiva</p>
      <h1 className="break-words text-3xl font-bold">{g.data?.title || r.title}</h1>
      {fromOffline && <div className="mt-2"><AvisoParcial>Sin conexión: mostrando la copia guardada en este dispositivo.</AvisoParcial></div>}
      {(g.data?.description || r.description) && <p className="mt-2 max-w-3xl whitespace-pre-line leading-relaxed">{g.data?.description || r.description}</p>}
      {canDownloadOffline(r) && <div className="my-4"><OfflineButton resource={r} /></div>}
      <div className="mt-4">
        {r.format !== 'IMAGE_SET' ? (
          <p className="text-brand-muted">Esta galería aún no tiene imágenes cargadas.</p>
        ) : g.loading && !g.data ? (
          <Cargando label="Cargando imágenes…" />
        ) : g.error || !g.data ? (
          <ErrorEstado message={g.error?.message ?? 'No se pudieron cargar las imágenes.'} onRetry={g.reload} />
        ) : (
          <GalleryViewer gallery={g.data} />
        )}
      </div>
    </div>
  );
}
