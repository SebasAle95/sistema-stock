import { negocio } from '@stock/shared';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioLogin } from '@/features/auth/FormularioLogin';
import { PantallaLogin } from '@/features/auth/PantallaLogin';
import { PantallaLoginBoutique } from '@/features/auth/PantallaLoginBoutique';

export const metadata: Metadata = { title: 'Ingresar' };

// Cada estilo tiene su pantalla de login; el formulario es el mismo.
const Pantalla = negocio.estilo === 'boutique' ? PantallaLoginBoutique : PantallaLogin;

export default function PaginaLogin() {
  return (
    <Pantalla titulo="Iniciar sesión" subtitulo="Ingresá con tu usuario y tu contraseña.">
      {/* useSearchParams necesita un Suspense alrededor */}
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </Pantalla>
  );
}
