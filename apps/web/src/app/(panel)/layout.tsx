import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Layout de las pantallas internas del sistema. Todo lo que esté dentro de la
 * carpeta (panel) se muestra con barra superior y menú. Las pantallas sin menú
 * (por ejemplo, el login) van fuera de esta carpeta.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
