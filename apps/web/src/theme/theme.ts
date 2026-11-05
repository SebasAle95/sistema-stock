'use client';

import { esES } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { negocio } from '@stock/shared';

/**
 * Tema de Material UI. Los colores salen de la configuración del negocio
 * (packages/shared/src/config/negocio.ts), así cada sistema tiene los suyos.
 * `esES` traduce los textos internos de los componentes (paginación, etc.).
 */
export const theme = createTheme(
  {
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: negocio.tema.primario },
          secondary: { main: negocio.tema.secundario },
          background: { default: '#f6f4f9' },
        },
      },
      dark: {
        palette: {
          primary: { main: negocio.tema.secundario },
          secondary: { main: negocio.tema.primario },
        },
      },
    },
    typography: {
      fontFamily: 'var(--font-roboto), system-ui, sans-serif',
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
      },
    },
  },
  esES,
);
