'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import { formatearFechaHora, formatearMoneda, nombreMedioDePago, type Pagina, type Venta } from '@stock/shared';
import { useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { useConsulta } from '@/hooks/useConsulta';
import { DialogoDetalleVenta } from './DialogoDetalleVenta';

export function PantallaVentas() {
  const { tienePermiso } = useSesion();
  const verTodas = tienePermiso('ventas.ver_todas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);
  const [elegida, setElegida] = useState<Venta | null>(null);

  const parametros = new URLSearchParams({ pagina: String(pagina + 1), porPagina: String(porPagina) });
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const ventas = useConsulta<Pagina<Venta>>(`/ventas?${parametros}`);

  return (
    <Stack spacing={3}>
      <EncabezadoPagina
        titulo="Ventas"
        descripcion={verTodas ? 'Todas las ventas. Tocá una para ver el detalle o anularla.' : 'Ventas de la caja abierta.'}
      />

      <Card variant="outlined">
        {verTodas && (
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
        )}
        <Box sx={{ height: 4 }}>{ventas.cargando && <LinearProgress />}</Box>
        {ventas.error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {ventas.error}
          </Alert>
        )}
        <TableContainer>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>N°</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Vendedor</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell>Medio de pago</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventas.datos?.items.map((v) => (
                <TableRow key={v.id} hover onClick={() => setElegida(v)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{v.numero}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{formatearFechaHora(v.creadoEn)}</TableCell>
                  <TableCell>{v.usuario.nombre}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" noWrap>
                      {v.items.map((i) => `${i.cantidad} ${i.nombre}`).join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{nombreMedioDePago(v.medioPago)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {v.anulada ? (
                      <Chip size="small" label="Anulada" color="warning" variant="outlined" />
                    ) : (
                      <Typography sx={{ fontWeight: 700 }}>{formatearMoneda(v.total)}</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {ventas.datos && ventas.datos.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    {verTodas ? 'No hay ventas en ese período.' : 'Todavía no hay ventas en esta caja (o la caja está cerrada).'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={ventas.datos?.total ?? 0}
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

      {elegida && (
        <DialogoDetalleVenta
          venta={elegida}
          alCerrar={() => setElegida(null)}
          alAnular={(venta) => {
            setElegida(venta);
            ventas.recargar();
          }}
        />
      )}
    </Stack>
  );
}
