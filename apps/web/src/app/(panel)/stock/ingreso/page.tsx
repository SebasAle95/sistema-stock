import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaIngreso } from '@/features/stock/PantallaIngreso';

export const metadata: Metadata = { title: 'Ingreso de mercadería' };

export default function PaginaIngreso() {
  return (
    <RequierePermiso permiso="stock.ingresar">
      <PantallaIngreso />
    </RequierePermiso>
  );
}
