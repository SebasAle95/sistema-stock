import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaCaja } from '@/features/caja/PantallaCaja';

export const metadata: Metadata = { title: 'Caja' };

export default function Pagina() {
  return (
    <RequierePermiso permiso="caja.operar">
      <PantallaCaja />
    </RequierePermiso>
  );
}
