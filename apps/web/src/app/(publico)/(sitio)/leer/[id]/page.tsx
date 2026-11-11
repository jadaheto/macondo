'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useResource } from '@/components/useResource';
import { Cargando, ErrorEstado } from '@/components/StateViews';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Icon } from '@/components/Icon';
import { fileUrl, inaccessibleReasons } from '@/lib/resource';

// Lectores cargados solo en el cliente (epub.js y pdf.js dependen del DOM).
const EpubReader = dynamic(() => import('@/components/EpubReader'), { ssr: false, loading: () => <Cargando label="Preparando lector…" /> });
const PdfReader = dynamic(() => import('@/components/PdfReader'), { ssr: false, loading: () => <Cargando label="Preparando lector…" /> });

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error, loading, reload } = useResource(id);

  if (loading && !r) return <Cargando />;
  if (error || !r) return <ErrorEstado message={error?.message ?? 'No encontramos este recurso.'} onRetry={reload} />;

  return (
    <div>
      <Link href={`/recurso/${r.id}`} className="btn-fantasma -ml-3">
        <Icon name="volver" className="h-5 w-5" /> Volver a la ficha
      </Link>
      <h1 className="mb-3 break-words text-2xl font-bold">{r.title}</h1>
      {!r.accessible ? (
        <ErrorEstado title="Este recurso no está disponible" message={inaccessibleReasons(r).join(' ')} />
      ) : !r.hasFile ? (
        <ErrorEstado title="Sin archivo" message="Este recurso todavía no tiene un archivo cargado." />
      ) : r.format === 'EPUB' ? (
        <EpubReader resourceId={r.id} title={r.title} />
      ) : r.format === 'PDF' ? (
        <PdfReader resourceId={r.id} title={r.title} />
      ) : r.format === 'MP3' ? (
        <div className="mx-auto max-w-2xl">
          <AudioPlayer resourceId={r.id} src={fileUrl(r.id)} title={r.title} narrator={r.narrator} />
          {r.description && <p className="mt-4 whitespace-pre-line text-brand-muted">{r.description}</p>}
        </div>
      ) : r.format === 'IMAGE_SET' ? (
        <p>
          Este recurso es una galería. <Link className="font-semibold text-brand-secondary underline" href={`/galeria/${r.id}`}>Abrir galería</Link>
        </p>
      ) : (
        <ErrorEstado title="Formato no compatible" message="Este formato todavía no se puede abrir en Macondo Digital." />
      )}
    </div>
  );
}
