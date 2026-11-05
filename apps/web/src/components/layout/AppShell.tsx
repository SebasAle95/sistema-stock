'use client';

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { negocio, type ConfigNegocio } from '@stock/shared';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { BotonTema } from './BotonTema';
import { MenuNavegacion } from './MenuNavegacion';
import { MenuUsuario } from './MenuUsuario';

const ANCHO_MENU = 248;

// Tipado como la interfaz: en otros negocios el logo puede no estar.
const config: ConfigNegocio = negocio;

/**
 * Logo del negocio en la barra superior. Va sobre un recuadro blanco porque el
 * PNG es transparente y sus colores se perderían sobre la barra de color.
 * Sin logo configurado, se muestra un ícono genérico.
 */
function Marca() {
  if (!config.logo) return <Inventory2OutlinedIcon sx={{ mr: 1.5 }} />;
  return (
    <Box
      sx={{
        position: 'relative',
        width: 44,
        height: 44,
        mr: 1.5,
        flexShrink: 0,
        bgcolor: '#ffffff',
        borderRadius: 2,
        p: 0.5,
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Image src={config.logo.src} alt={config.logo.alt} fill priority sizes="40px" style={{ objectFit: 'contain' }} />
      </Box>
    </Box>
  );
}

/**
 * Estructura de todas las pantallas del panel: barra superior + menú lateral + contenido.
 * En escritorio el menú queda fijo; en celular se abre con el botón de hamburguesa.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (tema) => tema.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Marca />
          <Typography variant="h6" component="span" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {negocio.nombre}
          </Typography>
          <BotonTema />
          <MenuUsuario />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: ANCHO_MENU }, flexShrink: { md: 0 } }}>
        {/* Celular: menú desplegable */}
        <Drawer
          variant="temporary"
          open={menuAbierto}
          onClose={() => setMenuAbierto(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: ANCHO_MENU } }}
        >
          <MenuNavegacion alNavegar={() => setMenuAbierto(false)} />
        </Drawer>

        {/* Escritorio: menú fijo */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' },
          }}
        >
          <MenuNavegacion />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        {/* Espacio para que el contenido empiece debajo de la barra superior */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
