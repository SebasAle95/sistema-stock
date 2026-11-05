import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { Metadata } from 'next';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { EstadoDelSistema } from '@/features/sistema/EstadoDelSistema';
import { AlertaStockBajo } from '@/features/stock/AlertaStockBajo';

export const metadata: Metadata = { title: 'Inicio' };

export default function PaginaInicio() {
  return (
    <Stack spacing={3}>
      <EncabezadoPagina titulo="Inicio" descripcion="Resumen del día." />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        <AlertaStockBajo />
        <EstadoDelSistema />
      </Box>
    </Stack>
  );
}
