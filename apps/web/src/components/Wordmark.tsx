import Link from 'next/link';
import { Butterfly } from './Butterfly';

export const COMFASUCRE_LOGO = '/brand/images/logo_comfasucre.png';
export const COMFASUCRE_LOGO_WHITE = '/brand/images/logo_white.png';
export const COMFASUCRE_ALT = 'Comfasucre, de todos';

/** Logotipo Comfasucre (PNG 1920×845, fondos claros) con proporción conservada (object-fit: contain). */
export function ComfasucreLogo({
  className = 'h-11 w-[100px]',
  variant = 'color',
  style,
}: {
  className?: string;
  variant?: 'color' | 'white';
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === 'white' ? COMFASUCRE_LOGO_WHITE : COMFASUCRE_LOGO}
      alt={COMFASUCRE_ALT}
      width={1920}
      height={845}
      decoding="async"
      style={style}
      className={`block shrink-0 object-contain ${className}`}
    />
  );
}

/**
 * Bloque de marca: logotipo Comfasucre + divisor + nombre del producto.
 * La mariposa amarilla es solo un acento decorativo secundario de Biblioteca Macondo.
 */
export function Wordmark({ compact = false, href = '/' }: { compact?: boolean; href?: string | null }) {
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      <ComfasucreLogo className={compact ? 'h-9 w-[82px]' : 'h-11 w-[100px] sm:h-[52px] sm:w-[118px]'} />
      <span className="h-9 w-px shrink-0 bg-brand-border" aria-hidden="true" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-lg font-bold text-brand-primary sm:text-xl">Macondo Digital</span>
        {!compact && (
          <span className="flex items-center gap-1 text-sm text-brand-muted">
            Biblioteca Macondo
            <Butterfly className="h-4 w-4" />
          </span>
        )}
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex min-h-touch min-w-0 items-center rounded-control" aria-label="Comfasucre, de todos · Macondo Digital, Biblioteca Macondo: ir al inicio">
      {inner}
    </Link>
  );
}
