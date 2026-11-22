import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { negocio } from '@stock/shared';
import type { Metadata } from 'next';
import { Jost, Playfair_Display, Roboto } from 'next/font/google';
import type { ReactNode } from 'react';
import { Proveedores } from '@/components/Proveedores';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

// Tipografías del estilo "boutique" (theme.ts). Sin precarga: el navegador las descarga
// solo si la página las usa, así un cliente con el estilo clásico no carga nada de más.
const titulosBoutique = Playfair_Display({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-titulos',
});
const textoBoutique = Jost({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-boutique',
});

export const metadata: Metadata = {
  title: {
    default: negocio.nombre,
    template: `%s · ${negocio.nombreCorto}`,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${roboto.variable} ${titulosBoutique.variable} ${textoBoutique.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Aplica el modo claro/oscuro antes de pintar, para evitar el parpadeo */}
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        <AppRouterCacheProvider>
          <Proveedores>{children}</Proveedores>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
