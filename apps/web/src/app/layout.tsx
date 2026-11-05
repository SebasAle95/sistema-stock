import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { negocio } from '@stock/shared';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import type { ReactNode } from 'react';
import { Proveedores } from '@/components/Proveedores';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: {
    default: negocio.nombre,
    template: `%s · ${negocio.nombreCorto}`,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={roboto.variable} suppressHydrationWarning>
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
