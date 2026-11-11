import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Página no encontrada' };

/**
 * Con varios root layouts (portal y /admin) Next no tiene un not-found global y sirve su 404
 * por defecto, en inglés. Esta ruta comodín captura cualquier URL desconocida del portal y
 * delega en `(publico)/not-found.tsx` (en español, con la identidad Comfasucre).
 */
export default function RutaNoEncontrada() {
  notFound();
}
