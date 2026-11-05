'use client';

import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { nombresDeRoles } from '@stock/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useSesion } from '@/features/auth/SesionProvider';

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? (partes.at(-1)?.[0] ?? '') : '')).toUpperCase();
}

export function MenuUsuario() {
  const { usuario, cerrarSesion } = useSesion();
  const [ancla, setAncla] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="Tu cuenta">
        <IconButton onClick={(e) => setAncla(e.currentTarget)} aria-label="Tu cuenta" sx={{ ml: 0.5 }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 15, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
            {iniciales(usuario.nombre)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={ancla}
        open={Boolean(ancla)}
        onClose={() => setAncla(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 600 }}>{usuario.nombre}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {usuario.usuario} · {nombresDeRoles[usuario.rol]}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} href="/cambiar-password" onClick={() => setAncla(null)}>
          <ListItemIcon>
            <KeyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Cambiar contraseña
        </MenuItem>
        <MenuItem onClick={() => void cerrarSesion()}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  );
}
