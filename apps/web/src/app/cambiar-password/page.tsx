import type { Metadata } from 'next';
import { FormularioCambiarPassword } from '@/features/auth/FormularioCambiarPassword';
import { PantallaCentrada } from '@/features/auth/PantallaCentrada';
import { SesionProvider } from '@/features/auth/SesionProvider';

export const metadata: Metadata = { title: 'Cambiar contraseña' };

export default function PaginaCambiarPassword() {
  return (
    <SesionProvider permitirPasswordPendiente>
      <PantallaCentrada titulo="Cambiar contraseña">
        <FormularioCambiarPassword />
      </PantallaCentrada>
    </SesionProvider>
  );
}
