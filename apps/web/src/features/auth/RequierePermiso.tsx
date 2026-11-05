'use client';

import Alert from '@mui/material/Alert';
import type { Permiso } from '@stock/shared';
import type { ReactNode } from 'react';
import { useSesion } from './SesionProvider';

/**
 * Muestra el contenido solo si el rol tiene el permiso. Es para la interfaz:
 * la API vuelve a controlar el permiso en cada pedido.
 */
export function RequierePermiso({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const { tienePermiso } = useSesion();
  if (!tienePermiso(permiso)) {
    return <Alert severity="warning">No tenés permiso para ver esta sección.</Alert>;
  }
  return children;
}
