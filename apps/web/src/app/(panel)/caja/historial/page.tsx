import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaHistorialCajas } from '@/features/caja/PantallaHistorialCajas';

export const metadata: Metadata = { title: 'Historial de cajas' };

export default function Pagina() {
  return (
    <RequierePermiso permiso="caja.ver_totales">
      <PantallaHistorialCajas />
    </RequierePermiso>
  );
}
