import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  descripcion?: string;
  /** Botón principal de la pantalla (por ejemplo, "Nuevo producto"). */
  accion?: ReactNode;
}

/** Título de cada pantalla, con descripción y acción principal opcionales. */
export function EncabezadoPagina({ titulo, descripcion, accion }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-end' } }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {titulo}
        </Typography>
        {descripcion && <Typography sx={{ color: 'text.secondary' }}>{descripcion}</Typography>}
      </Box>
      {accion}
    </Stack>
  );
}
