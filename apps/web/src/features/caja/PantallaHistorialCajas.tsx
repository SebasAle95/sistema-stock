'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatearFechaHora, formatearMoneda, type Caja, type Pagina } from '@stock/shared';
import { useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useConsulta } from '@/hooks/useConsulta';
import { ChipDiferencia } from './ChipDiferencia';

/** Cajas cerradas con lo esperado, lo contado y la diferencia (solo administradores). */
export function PantallaHistorialCajas() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);

  const parametros = new URLSearchParams({ pagina: String(pagina + 1), porPagina: String(porPagina) });
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const cajas = useConsulta<Pagina<Caja>>(`/caja/historial?${parametros}`);

  return (
    <Stack spacing={3}>
      <EncabezadoPagina titulo="Historial de cajas" descripcion="Cada turno cerrado: cuánto se vendió y si la plata cerró." />

      <Card variant="outlined">
        <Stack direction="row" spacing={2} sx={{ p: 2 }}>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPagina(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPagina(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Box sx={{ height: 4 }}>{cajas.cargando && <LinearProgress />}</Box>
        {cajas.error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {cajas.error}
          </Alert>
        )}
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Caja</TableCell>
                <TableCell>Apertura</TableCell>
                <TableCell>Cierre</TableCell>
                <TableCell align="right">Ventas</TableCell>
                <TableCell align="right">Total vendido</TableCell>
                <TableCell align="right">Esperado</TableCell>
                <TableCell align="right">Contado</TableCell>
                <TableCell>Diferencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cajas.datos?.items.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>#{c.numero}</TableCell>
                  <TableCell>
                    {formatearFechaHora(c.abiertaEn)}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {c.abiertaPor.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {c.cerradaEn ? formatearFechaHora(c.cerradaEn) : '—'}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {c.cerradaPor?.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{c.cantidadVentas}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatearMoneda(c.resumen?.totalVentas ?? 0)}
                  </TableCell>
                  <TableCell align="right">{formatearMoneda(c.resumen?.efectivoEsperado ?? 0)}</TableCell>
                  <TableCell align="right">{c.efectivoContado != null ? formatearMoneda(c.efectivoContado) : '—'}</TableCell>
                  <TableCell>
                    <ChipDiferencia diferencia={c.diferencia} />
                    {c.notaCierre && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {c.notaCierre}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {cajas.datos && cajas.datos.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    No hay cajas cerradas en ese período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={cajas.datos?.total ?? 0}
          page={pagina}
          rowsPerPage={porPagina}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_, nueva) => setPagina(nueva)}
          onRowsPerPageChange={(e) => {
            setPorPagina(Number(e.target.value));
            setPagina(0);
          }}
        />
      </Card>
    </Stack>
  );
}
