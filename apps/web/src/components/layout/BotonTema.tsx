'use client';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

/** Alterna entre modo claro y oscuro. MUI recuerda la elección en el navegador. */
export function BotonTema() {
  const { mode, setMode } = useColorScheme();

  // En el servidor todavía no se conoce el modo: se reserva el lugar para que no salte el diseño.
  if (!mode) return <Box sx={{ width: 40 }} />;

  const oscuro = mode === 'dark';

  return (
    <Tooltip title={oscuro ? 'Modo claro' : 'Modo oscuro'}>
      <IconButton color="inherit" onClick={() => setMode(oscuro ? 'light' : 'dark')}>
        {oscuro ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
