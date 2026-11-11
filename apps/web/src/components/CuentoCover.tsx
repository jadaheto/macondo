'use client';

import { cuentoCoverSvg, type CuentoLugar, type CuentoTipo } from '@macondo/shared';

/** Portada del cuento (SVG del contrato) renderizada en el navegador; la API guarda el PNG solo al aprobar. */
export function CuentoCover({ titulo, autorNombre, lugar, tipo, className = '' }: { titulo: string; autorNombre: string | null; lugar: CuentoLugar; tipo: CuentoTipo; className?: string }) {
  const svg = cuentoCoverSvg({ titulo, autorNombre, lugar, tipo });
  return (
    <div
      className={`overflow-hidden rounded-card shadow-card [&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      data-testid="cuento-portada"
      // SVG construido por nosotros a partir de texto escapado (sin HTML del usuario).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
