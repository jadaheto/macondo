'use client';

import { useState } from 'react';
import { COVER_GRID_WIDTH, COVER_LARGE_WIDTH, type ResourceDTO, type ResourceType } from '@macondo/shared';
import { coverUrl, typeLabel } from '@/lib/resource';
import { Icon, type IconName } from './Icon';

const TYPE_STYLE: Record<ResourceType, { bg: string; icon: IconName }> = {
  // Respaldo por tipo con degradados de la marca (texto blanco ≥4.5:1 en ambos extremos).
  BOOK: { bg: 'from-brand-primary to-brand-secondary', icon: 'libro' },
  AUDIOBOOK: { bg: 'from-brand-accent-strong to-brand-primary', icon: 'audifonos' },
  AUDIOBIOGRAPHY: { bg: 'from-brand-secondary to-brand-primary-hover', icon: 'persona' },
  AUDIOSUMMARY: { bg: 'from-brand-positive-strong to-brand-primary', icon: 'resumen' },
  GALLERY: { bg: 'from-brand-secondary to-brand-accent-strong', icon: 'galeria' },
};

/**
 * `grid`: tarjetas de catálogo, kiosco y listas (miniatura de 240 px; 480 px en pantallas de alta densidad).
 * `large`: ficha del recurso, detalle del kiosco y TV (480 px).
 */
export type CoverSize = 'grid' | 'large';

/** Dimensiones intrínsecas 3:4 por tamaño: reservan el espacio antes de que cargue la imagen (sin saltos). */
export const COVER_DIMENSIONS: Record<CoverSize, { width: number; height: number; sizes: string }> = {
  grid: { width: COVER_GRID_WIDTH, height: (COVER_GRID_WIDTH * 4) / 3, sizes: '(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw' },
  large: { width: COVER_LARGE_WIDTH, height: (COVER_LARGE_WIDTH * 4) / 3, sizes: '(min-width: 768px) 280px, 70vw' },
};

type CoverResource = Pick<ResourceDTO, 'id' | 'hasCover' | 'type' | 'title'>;

/** `srcset` con las dos miniaturas disponibles en la API; el navegador elige según `sizes` y densidad. */
export function coverSrcSet(resource: Pick<ResourceDTO, 'id' | 'hasCover'>): string | undefined {
  if (!resource.hasCover) return undefined;
  return `${coverUrl(resource, COVER_GRID_WIDTH)} ${COVER_GRID_WIDTH}w, ${coverUrl(resource, COVER_LARGE_WIDTH)} ${COVER_LARGE_WIDTH}w`;
}

/** Portada con respaldo ilustrado por tipo si no hay imagen o falla la carga. */
export function Cover({ resource, className = '', size = 'grid' }: { resource: CoverResource; className?: string; size?: CoverSize }) {
  const [failed, setFailed] = useState(false);
  const dims = COVER_DIMENSIONS[size];
  const src = coverUrl(resource, size === 'large' ? COVER_LARGE_WIDTH : COVER_GRID_WIDTH);
  const style = TYPE_STYLE[resource.type] ?? TYPE_STYLE.BOOK;
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        srcSet={coverSrcSet(resource)}
        sizes={dims.sizes}
        width={dims.width}
        height={dims.height}
        alt={`Portada de ${resource.title}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`aspect-[3/4] h-auto w-full rounded-control border border-brand-border object-cover bg-brand-soft ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${typeLabel(resource.type)}: ${resource.title} (sin portada)`}
      className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-control bg-gradient-to-br p-3 text-center text-white ${style.bg} ${className}`}
    >
      <Icon name={style.icon} className="h-1/4 w-1/4 min-h-8 min-w-8" />
      <span className="line-clamp-3 text-sm font-bold leading-snug">{resource.title}</span>
    </div>
  );
}
