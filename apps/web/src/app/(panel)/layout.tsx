import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SesionProvider } from '@/features/auth/SesionProvider';

/**
 * Layout de las pantallas internas del sistema. Todo lo que esté dentro de la
 * carpeta (panel) exige sesión y se muestra con barra superior y menú. Las
 * pantallas sin menú (login, cambio de contraseña) van fuera de esta carpeta.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <SesionProvider>
      <AppShell>{children}</AppShell>
    </SesionProvider>
  );
}
