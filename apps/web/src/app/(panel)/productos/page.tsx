import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PantallaProductos } from '@/features/productos/PantallaProductos';

export const metadata: Metadata = { title: 'Productos' };

export default function PaginaProductos() {
  return (
    // PantallaProductos lee filtros de la URL (useSearchParams), que necesita un Suspense alrededor.
    <Suspense>
      <PantallaProductos />
    </Suspense>
  );
}
