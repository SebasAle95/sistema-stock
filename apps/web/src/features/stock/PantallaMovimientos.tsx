'use client';

import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip, { type ChipProps } from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
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
import {
  formatearFechaHora,
  formatearMoneda,
  nombresDeMovimientos,
  TIPOS_MOVIMIENTO_STOCK,
  type MovimientoStock,
  type Pagina,
  type TipoMovimientoStock,
} from '@stock/shared';
import { useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { useConsulta } from '@/hooks/useConsulta';
import { useValorDiferido } from '@/hooks/useValorDiferido';

const colorPorTipo: Record<TipoMovimientoStock, ChipProps['color']> = {
  inicial: 'default',
  ingreso: 'success',
  ajuste: 'info',
  merma: 'warning',
  venta: 'primary',
  anulacion_venta: 'secondary',
};

/** Historial de todos los cambios de stock: qué, cuánto, quién y cuándo. */
export function PantallaMovimientos() {
  const { tienePermiso } = useSesion();
  const conCostos = tienePermiso('productos.ver_costos');

  const [texto, setTexto] = useState('');
  const buscar = useValorDiferido(texto.trim(), 300);
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);

  const parametros = new URLSearchParams({ pagina: String(pagina + 1), porPagina: String(porPagina) });
  if (buscar) parametros.set('buscar', buscar);
  if (tipo) parametros.set('tipo', tipo);
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const movimientos = useConsulta<Pagina<MovimientoStock>>(`/stock/movimientos?${parametros}`);

  const reiniciarPagina = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPagina(0);
  };

  return (
    <Stack spacing={3}>
      <EncabezadoPagina
        titulo="Movimientos de stock"
        descripcion="Cada ingreso, venta, ajuste y merma, con quién lo hizo y cuándo."
      />

      <Card variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar producto"
            value={texto}
            onChange={(e) => reiniciarPagina(setTexto)(e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Tipo"
            value={tipo}
            onChange={(e) => reiniciarPagina(setTipo)(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {TIPOS_MOVIMIENTO_STOCK.map((t) => (
              <MenuItem key={t} value={t}>
                {nombresDeMovimientos[t]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={desde}
            onChange={(e) => reiniciarPagina(setDesde)(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={hasta}
            onChange={(e) => reiniciarPagina(setHasta)(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        <Box sx={{ height: 4 }}>{movimientos.cargando && <LinearProgress />}</Box>
        {movimientos.error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {movimientos.error}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ minWidth: 820 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="center">Stock</TableCell>
                {conCostos && <TableCell align="right">Costo unit.</TableCell>}
                <TableCell>Usuario</TableCell>
                <TableCell>Nota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.datos?.items.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{formatearFechaHora(m.creadoEn)}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{m.producto.nombre}</TableCell>
                  <TableCell>
                    <Chip size="small" label={nombresDeMovimientos[m.tipo]} color={colorPorTipo[m.tipo]} variant="outlined" />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: m.cantidad > 0 ? 'success.main' : 'error.main', whiteSpace: 'nowrap' }}
                  >
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </TableCell>
                  <TableCell align="center">{m.stockResultante}</TableCell>
                  {conCostos && (
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {m.costoUnitario != null ? formatearMoneda(m.costoUnitario) : '—'}
                    </TableCell>
                  )}
                  <TableCell>{m.usuario.nombre}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 240 }}>
                    <Typography variant="body2" noWrap title={m.nota ?? undefined}>
                      {m.nota ?? '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {movimientos.datos && movimientos.datos.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={conCostos ? 8 : 7} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    No hay movimientos con esos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={movimientos.datos?.total ?? 0}
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
