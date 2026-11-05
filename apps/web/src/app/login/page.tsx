import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioLogin } from '@/features/auth/FormularioLogin';
import { PantallaCentrada } from '@/features/auth/PantallaCentrada';

export const metadata: Metadata = { title: 'Ingresar' };

export default function PaginaLogin() {
  return (
    <PantallaCentrada titulo="Ingresar" subtitulo="Usá el usuario que te dio el administrador.">
      {/* useSearchParams necesita un Suspense alrededor */}
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </PantallaCentrada>
  );
}
