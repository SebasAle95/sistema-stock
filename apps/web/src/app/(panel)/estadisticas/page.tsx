import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaEstadisticas } from '@/features/estadisticas/PantallaEstadisticas';

export const metadata: Metadata = { title: 'Estadísticas' };

export default function Pagina() {
  return (
    <RequierePermiso permiso="estadisticas.ver">
      <PantallaEstadisticas />
    </RequierePermiso>
  );
}
