import { tieneFuncionalidad } from '@stock/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaEtiquetas } from '@/features/etiquetas/PantallaEtiquetas';

export const metadata: Metadata = { title: 'Etiquetas' };

export default function PaginaEtiquetas() {
  // Solo existe en los clientes con la funcionalidad "etiquetas".
  if (!tieneFuncionalidad('etiquetas')) notFound();

  return (
    <RequierePermiso permiso="stock.ingresar">
      {/* PantallaEtiquetas lee ?modelo= de la URL (useSearchParams), que necesita un Suspense alrededor. */}
      <Suspense>
        <PantallaEtiquetas />
      </Suspense>
    </RequierePermiso>
  );
}
