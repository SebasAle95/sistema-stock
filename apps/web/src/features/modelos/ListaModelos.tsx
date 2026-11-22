'use client';

import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearMoneda, formatearNumero, type Pagina, type ResumenModelo } from '@stock/shared';
import { MuestraColor } from './MuestraColor';

interface Props {
  consulta: { datos?: Pagina<ResumenModelo>; cargando: boolean; error: string | null };
  hayFiltros: boolean;
  puedeGestionar: boolean;
  pagina: number;
  porPagina: number;
  alCambiarPagina: (pagina: number) => void;
  alCambiarPorPagina: (porPagina: number) => void;
  alAbrir: (modeloId: string) => void;
}

const MAXIMO_MUESTRAS = 6;

/** Un renglón por modelo: sus talles, sus colores y el stock sumado. Al tocarlo se abre su curva. */
export function ListaModelos({
  consulta,
  hayFiltros,
  puedeGestionar,
  pagina,
  porPagina,
  alCambiarPagina,
  alCambiarPorPagina,
  alAbrir,
}: Props) {
  return (
    <>
      <Box sx={{ height: 4 }}>{consulta.cargando && <LinearProgress />}</Box>
      {consulta.error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {consulta.error}
        </Alert>
      )}

      <TableContainer>
        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Modelo</TableCell>
              <TableCell>Talles</TableCell>
              <TableCell>Colores</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {consulta.datos?.items.map((m) => (
              <TableRow key={m.id} hover onClick={() => alAbrir(m.id)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{m.nombre}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {m.categoria?.nombre ?? 'Sin categoría'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: m.talles.length ? 'text.primary' : 'text.disabled' }}>
                  {m.talles.length ? m.talles.join(' · ') : 'Sin talle'}
                </TableCell>
                <TableCell>
                  {m.colores.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      Sin color
                    </Typography>
                  ) : (
                    <Tooltip title={m.colores.join(', ')}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', width: 'fit-content' }}>
                        {m.colores.slice(0, MAXIMO_MUESTRAS).map((color) => (
                          <MuestraColor key={color} color={color} tamano={14} />
                        ))}
                        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 0.5 }}>
                          {m.colores.length === 1 ? m.colores[0] : `${m.colores.length} colores`}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatearMoneda(m.precioVenta)}
                </TableCell>
                <TableCell align="center">
                  <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Chip
                      size="small"
                      variant={m.stock > 0 ? 'outlined' : 'filled'}
                      color={m.stock > 0 ? 'default' : 'error'}
                      label={formatearNumero(m.stock)}
                      sx={{ minWidth: 48, fontWeight: 600 }}
                    />
                    {m.combinacionesStockBajo > 0 && m.stock > 0 && (
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {m.combinacionesStockBajo === 1 ? '1 con stock bajo' : `${m.combinacionesStockBajo} con stock bajo`}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver stock por talle y color">
                    <IconButton aria-label={`Ver stock de ${m.nombre} por talle y color`}>
                      <GridViewOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {consulta.datos && consulta.datos.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  {hayFiltros
                    ? 'No hay modelos que coincidan con la búsqueda.'
                    : puedeGestionar
                      ? 'Todavía no hay modelos. Tocá "Nuevo modelo" para cargar una prenda con todos sus talles y colores.'
                      : 'Todavía no hay modelos cargados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={consulta.datos?.total ?? 0}
        page={pagina}
        rowsPerPage={porPagina}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={(_, nueva) => alCambiarPagina(nueva)}
        onRowsPerPageChange={(e) => alCambiarPorPagina(Number(e.target.value))}
      />
    </>
  );
}
