'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from '@/theme/theme';

/** Proveedores globales de la app (tema de MUI). Acá se suman los que vengan: sesión, etc. */
export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
