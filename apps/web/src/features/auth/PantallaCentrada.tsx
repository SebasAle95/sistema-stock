import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { negocio } from '@stock/shared';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

/** Tarjeta centrada en la pantalla, para login y cambio de contraseña. */
export function PantallaCentrada({ titulo, subtitulo, children }: Props) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 52, height: 52, mb: 1 }}>
              <Inventory2OutlinedIcon />
            </Avatar>
            <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
              {negocio.nombre}
            </Typography>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              {titulo}
            </Typography>
            {subtitulo && <Typography sx={{ color: 'text.secondary' }}>{subtitulo}</Typography>}
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
