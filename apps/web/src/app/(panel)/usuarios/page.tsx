import type { Metadata } from 'next';
import { RequierePermiso } from '@/features/auth/RequierePermiso';
import { PantallaUsuarios } from '@/features/usuarios/PantallaUsuarios';

export const metadata: Metadata = { title: 'Usuarios' };

export default function PaginaUsuarios() {
  return (
    <RequierePermiso permiso="usuarios.gestionar">
      <PantallaUsuarios />
    </RequierePermiso>
  );
}
