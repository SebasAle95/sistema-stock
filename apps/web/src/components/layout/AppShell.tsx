'use client';

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { negocio } from '@stock/shared';
import { useState, type ReactNode } from 'react';
import { BotonTema } from './BotonTema';
import { MenuNavegacion } from './MenuNavegacion';

const ANCHO_MENU = 248;

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
          <Inventory2OutlinedIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="span" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {negocio.nombre}
          </Typography>
          <BotonTema />
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
