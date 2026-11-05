'use client';

import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navegacionAdministracion, navegacionPrincipal, type ItemNavegacion } from '@/config/navegacion';
import { useSesion } from '@/features/auth/SesionProvider';

function coincide(rutaActual: string, destino: string): boolean {
  return destino === '/' ? rutaActual === '/' : rutaActual === destino || rutaActual.startsWith(`${destino}/`);
}

export function MenuNavegacion({ alNavegar }: { alNavegar?: () => void }) {
  const rutaActual = usePathname();
  const { tienePermiso } = useSesion();
  const visible = (item: ItemNavegacion) => !item.permiso || tienePermiso(item.permiso);
  const principal = navegacionPrincipal.filter(visible);
  const administracion = navegacionAdministracion.filter(visible);

  // Si varias coinciden (/caja y /caja/historial), queda marcada la más específica.
  const activa = [...principal, ...administracion]
    .filter((item) => coincide(rutaActual, item.ruta))
    .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.ruta;

  const items = (lista: ItemNavegacion[]) =>
    lista.map(({ titulo, ruta, Icono }) => (
      <ListItemButton
        key={ruta}
        component={Link}
        href={ruta}
        selected={ruta === activa}
        onClick={alNavegar}
        sx={{ borderRadius: 2, mb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Icono />
        </ListItemIcon>
        <ListItemText primary={titulo} />
      </ListItemButton>
    ));

  return (
    <>
      {/* Espacio para que el menú empiece debajo de la barra superior */}
      <Toolbar />
      <List sx={{ px: 1 }}>{items(principal)}</List>

      {/* El bloque de administración solo aparece si el rol tiene alguno de esos permisos. */}
      {administracion.length > 0 && (
        <>
          <Divider sx={{ mx: 2 }} />
          <List
            sx={{ px: 1 }}
            subheader={
              <ListSubheader
                disableSticky
                sx={{ bgcolor: 'transparent', lineHeight: '36px', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 12 }}
              >
                Administración
              </ListSubheader>
            }
          >
            {items(administracion)}
          </List>
        </>
      )}
    </>
  );
}
