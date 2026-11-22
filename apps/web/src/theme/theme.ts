'use client';

import { esES } from '@mui/material/locale';
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { negocio, type ConfigNegocio } from '@stock/shared';

const { tema, estilo = 'clasico' }: ConfigNegocio = negocio;

/**
 * Estilo clásico (La Frontera): barra de color y bordes redondeados.
 * Los colores salen de la configuración del cliente.
 */
const clasico: ThemeOptions = {
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: tema.primario },
        secondary: { main: tema.secundario },
        background: { default: '#f6f4f9' },
      },
    },
    dark: {
      palette: {
        primary: { main: tema.secundario },
        secondary: { main: tema.primario },
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
};

const titulos = 'var(--font-titulos), Georgia, "Times New Roman", serif';
const tituloSerif = { fontFamily: titulos, fontWeight: 600 } as const;

/**
 * Estilo boutique (tiendas de ropa): fondos claros y planos, títulos con serifa,
 * barra superior clara con el color de la marca en los detalles, esquinas más
 * rectas y encabezados de tabla discretos. Mismos componentes, otra estética.
 */
const boutique: ThemeOptions = {
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: tema.primario },
        secondary: { main: tema.secundario },
        background: { default: '#faf6f4', paper: '#ffffff' },
        text: { primary: '#2a2123', secondary: '#6f6266' },
        divider: 'rgba(42, 33, 35, 0.12)',
      },
    },
    dark: {
      palette: {
        primary: { main: tema.secundario },
        secondary: { main: tema.primario },
        background: { default: '#151112', paper: '#1d1819' },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-boutique), system-ui, sans-serif',
    h1: tituloSerif,
    h2: tituloSerif,
    h3: tituloSerif,
    h4: tituloSerif,
    h5: tituloSerif,
    h6: tituloSerif,
    overline: { letterSpacing: '0.14em', fontWeight: 500 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.02em' } },
    },
    // Barra clara (no de color) con una línea fina abajo.
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          backgroundImage: 'none',
          color: theme.vars.palette.text.primary,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: theme.vars.palette.text.secondary,
        }),
      },
    },
    // Ítem activo del menú: texto e ícono con el color de la marca.
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected, &.Mui-selected .MuiListItemIcon-root': { color: theme.vars.palette.primary.main },
        }),
      },
    },
  },
};

/** Tema de Material UI del cliente. `esES` traduce los textos internos de los componentes (paginación, etc.). */
export const theme = createTheme(estilo === 'boutique' ? boutique : clasico, esES);
