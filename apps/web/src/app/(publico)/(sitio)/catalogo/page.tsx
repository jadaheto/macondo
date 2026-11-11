import { Suspense } from 'react';
import { Cargando } from '@/components/StateViews';
import { CatalogView } from './CatalogView';

export const metadata = { title: 'Catálogo' };

export default function CatalogPage() {
  return (
    <Suspense fallback={<Cargando label="Cargando catálogo…" />}>
      <CatalogView />
    </Suspense>
  );
}
