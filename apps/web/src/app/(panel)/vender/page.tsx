import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaVender } from '@/features/ventas/PantallaVender';

export const metadata: Metadata = { title: 'Vender' };

export default function Pagina() {
  return (
    <RequierePermiso permiso="ventas.registrar">
      <PantallaVender />
    </RequierePermiso>
  );
}
