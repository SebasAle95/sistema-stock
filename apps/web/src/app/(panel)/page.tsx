import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { Metadata } from 'next';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { EstadoDelSistema } from '@/features/sistema/EstadoDelSistema';

export const metadata: Metadata = { title: 'Inicio' };

export default function PaginaInicio() {
  return (
    <Stack spacing={3}>
      <EncabezadoPagina titulo="Inicio" descripcion="La base del sistema está lista. Desde acá se van sumando los módulos." />

      <Box sx={{ maxWidth: 560 }}>
        <EstadoDelSistema />
      </Box>
    </Stack>
  );
}
