import { REMIX_GLYPHS } from './remixGlyphs';

/**
 * Iconografía Remix Icon (estilo `ri-*-line`, branding.md §9) dibujada en línea a partir de los
 * glifos del kit (`/brand/fonts/remixicon.svg`). Decorativos por defecto (aria-hidden); con `label`
 * se exponen como imagen con nombre accesible. Los botones solo-icono deben llevar su propio aria-label.
 */
export type IconName = keyof typeof REMIX_GLYPHS;

export function Icon({ name, className = 'h-6 w-6', label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1200"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      fill="currentColor"
    >
      <path transform="matrix(1 0 0 -1 0 1020)" d={REMIX_GLYPHS[name]} />
    </svg>
  );
}
