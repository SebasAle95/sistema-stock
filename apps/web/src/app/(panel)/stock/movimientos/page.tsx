import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaMovimientos } from '@/features/stock/PantallaMovimientos';

export const metadata: Metadata = { title: 'Movimientos de stock' };

export default function PaginaMovimientos() {
  return (
    <RequierePermiso permiso="stock.ver_historial">
      <PantallaMovimientos />
    </RequierePermiso>
  );
}
