'use client';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navegacion } from '@/config/navegacion';

function estaActiva(rutaActual: string, destino: string): boolean {
  return destino === '/' ? rutaActual === '/' : rutaActual.startsWith(destino);
}

export function MenuNavegacion({ alNavegar }: { alNavegar?: () => void }) {
  const rutaActual = usePathname();

  return (
    <>
      {/* Espacio para que el menú empiece debajo de la barra superior */}
      <Toolbar />
      <List sx={{ px: 1 }}>
        {navegacion.map(({ titulo, ruta, Icono }) => (
          <ListItemButton
            key={ruta}
            component={Link}
            href={ruta}
            selected={estaActiva(rutaActual, ruta)}
            onClick={alNavegar}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icono />
            </ListItemIcon>
            <ListItemText primary={titulo} />
          </ListItemButton>
        ))}
      </List>
    </>
  );
}
