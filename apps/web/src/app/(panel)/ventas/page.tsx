import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaVentas } from '@/features/ventas/PantallaVentas';

export const metadata: Metadata = { title: 'Ventas' };

export default function Pagina() {
  return (
    <RequierePermiso permiso="ventas.registrar">
      <PantallaVentas />
    </RequierePermiso>
  );
}
