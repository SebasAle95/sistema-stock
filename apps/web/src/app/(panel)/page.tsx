import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { EstadoDelSistema } from '@/features/sistema/EstadoDelSistema';

export const metadata: Metadata = { title: 'Inicio' };

export default function PaginaInicio() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Inicio
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          La base del sistema está lista. Desde acá se van sumando los módulos.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 560 }}>
        <EstadoDelSistema />
      </Box>
    </Stack>
  );
}
