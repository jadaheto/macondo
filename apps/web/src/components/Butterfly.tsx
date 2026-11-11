/**
 * Mariposa amarilla de Biblioteca Macondo. Acento decorativo SECUNDARIO: se usa pequeña junto al
 * nombre "Biblioteca Macondo" y nunca compite con el logotipo ni la paleta Comfasucre. aria-hidden.
 */
export function Butterfly({ className = 'h-4 w-4', color = '#F2C230' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <g fill={color} stroke="#A87E0A" strokeWidth="2" strokeLinejoin="round">
        <path d="M31 30 C20 10, 4 12, 6 26 C7 34, 18 36, 31 33 Z" />
        <path d="M33 30 C44 10, 60 12, 58 26 C57 34, 46 36, 33 33 Z" />
        <path d="M31 34 C20 36, 12 46, 18 52 C23 56, 29 46, 31 38 Z" />
        <path d="M33 34 C44 36, 52 46, 46 52 C41 56, 35 46, 33 38 Z" />
      </g>
      <path d="M32 24 L32 46" stroke="#24364b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
