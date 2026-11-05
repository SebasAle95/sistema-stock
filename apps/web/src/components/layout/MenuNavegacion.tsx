'use client';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navegacion } from '@/config/navegacion';
import { useSesion } from '@/features/auth/SesionProvider';

function coincide(rutaActual: string, destino: string): boolean {
  return destino === '/' ? rutaActual === '/' : rutaActual === destino || rutaActual.startsWith(`${destino}/`);
}

export function MenuNavegacion({ alNavegar }: { alNavegar?: () => void }) {
  const rutaActual = usePathname();
  const { tienePermiso } = useSesion();
  const visibles = navegacion.filter((item) => !item.permiso || tienePermiso(item.permiso));
  // Si varias coinciden (/caja y /caja/historial), queda marcada la más específica.
  const activa = visibles
    .filter((item) => coincide(rutaActual, item.ruta))
    .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.ruta;
  const estaActiva = (_: string, destino: string) => destino === activa;

  return (
    <>
      {/* Espacio para que el menú empiece debajo de la barra superior */}
      <Toolbar />
      <List sx={{ px: 1 }}>
        {visibles.map(({ titulo, ruta, Icono }) => (
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
