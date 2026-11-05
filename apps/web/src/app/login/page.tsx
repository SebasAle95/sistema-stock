import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioLogin } from '@/features/auth/FormularioLogin';
import { PantallaLogin } from '@/features/auth/PantallaLogin';

export const metadata: Metadata = { title: 'Ingresar' };

export default function PaginaLogin() {
  return (
    <PantallaLogin titulo="Iniciar sesión" subtitulo="Ingresá con tu usuario y tu contraseña.">
      {/* useSearchParams necesita un Suspense alrededor */}
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </PantallaLogin>
  );
}
