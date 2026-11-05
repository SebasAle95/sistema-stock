'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  esquemaIngresoStock,
  formatearNumero,
  parsearNumero,
  type Producto,
  type ResultadoIngresoStock,
} from '@stock/shared';
import { useRef, useState } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { BuscadorProductos } from '@/features/productos/BuscadorProductos';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Linea {
  producto: Producto;
  cantidad: string;
  costo: string;
}

interface Aviso {
  severidad: AlertColor;
  mensaje: string;
}

const textoNumero = (valor: number | null | undefined) => (valor == null ? '' : String(valor));

/**
 * Ingreso de mercadería: se pasa la pistola por cada producto que llegó, se
 * ajusta la cantidad y se confirma todo junto (como un remito).
 */
export function PantallaIngreso() {
  const { tienePermiso } = useSesion();
  const conCostos = tienePermiso('productos.ver_costos');

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [nota, setNota] = useState('');
  const [actualizarCosto, setActualizarCosto] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const refBuscador = useRef<HTMLInputElement>(null);

  function agregar(producto: Producto) {
    if (!producto.activo) return setAviso({ severidad: 'warning', mensaje: `"${producto.nombre}" está desactivado.` });
    if (!producto.controlaStock) {
      return setAviso({ severidad: 'warning', mensaje: `"${producto.nombre}" no lleva control de stock.` });
    }
    setLineas((actuales) => {
      const existente = actuales.find((l) => l.producto.id === producto.id);
      if (existente) {
        // Escanear de nuevo el mismo producto suma una unidad.
        const cantidad = (parsearNumero(existente.cantidad) || 0) + 1;
        return actuales.map((l) => (l === existente ? { ...l, cantidad: String(cantidad) } : l));
      }
      return [...actuales, { producto, cantidad: '1', costo: textoNumero(producto.precioCosto) }];
    });
  }

  function cambiarLinea(id: string, campo: 'cantidad' | 'costo', valor: string) {
    setLineas((actuales) => actuales.map((l) => (l.producto.id === id ? { ...l, [campo]: valor } : l)));
  }

  const totalUnidades = lineas.reduce((suma, l) => suma + (parsearNumero(l.cantidad) || 0), 0);

  async function confirmar() {
    const items = lineas.map((l) => ({
      productoId: l.producto.id,
      cantidad: parsearNumero(l.cantidad),
      costoUnitario: conCostos ? parsearNumero(l.costo) : null,
    }));
    const conError = lineas.find((_, i) => {
      const item = items[i];
      return !item || item.cantidad === null || Number.isNaN(item.cantidad) || Number.isNaN(item.costoUnitario);
    });
    if (conError) return setAviso({ severidad: 'error', mensaje: `Revisá los números de "${conError.producto.nombre}".` });

    const validacion = esquemaIngresoStock.safeParse({ items, nota: nota || undefined, actualizarCosto });
    if (!validacion.success) {
      return setAviso({ severidad: 'error', mensaje: validacion.error.issues[0]?.message ?? 'Datos inválidos' });
    }

    setEnviando(true);
    try {
      const resultado = await api.post<ResultadoIngresoStock>('/stock/ingresos', validacion.data);
      setLineas([]);
      setNota('');
      setAviso({
        severidad: 'success',
        mensaje: `Ingreso registrado: ${formatearNumero(resultado.unidades)} unidades de ${resultado.productos} ${resultado.productos === 1 ? 'producto' : 'productos'}.`,
      });
    } catch (error) {
      setAviso({ severidad: 'error', mensaje: mensajeDeError(error) });
    } finally {
      setEnviando(false);
      refBuscador.current?.focus();
    }
  }

  return (
    <Stack spacing={3}>
      <EncabezadoPagina
        titulo="Ingreso de mercadería"
        descripcion="Pasá la pistola por cada producto que llegó, poné la cantidad y confirmá."
      />

      <Card variant="outlined" sx={{ p: 2 }}>
        <BuscadorProductos
          inputRef={refBuscador}
          alElegir={agregar}
          filtrar={(p) => p.controlaStock}
          alNoEncontrar={(codigo) =>
            setAviso({
              severidad: 'warning',
              mensaje: `No existe un producto con el código ${codigo}. ${
                tienePermiso('productos.gestionar') ? 'Dalo de alta en Productos.' : 'Pedile al administrador que lo dé de alta.'
              }`,
            })
          }
          alError={(mensaje) => setAviso({ severidad: 'error', mensaje })}
        />
      </Card>

      <Card variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="center">Stock actual</TableCell>
                <TableCell sx={{ width: 130 }}>Cantidad</TableCell>
                {conCostos && <TableCell sx={{ width: 160 }}>Costo unitario</TableCell>}
                <TableCell align="center">Queda en</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {lineas.map((l) => {
                const cantidad = parsearNumero(l.cantidad);
                const valida = cantidad !== null && Number.isInteger(cantidad) && cantidad > 0;
                return (
                  <TableRow key={l.producto.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{l.producto.nombre}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'ui-monospace, Consolas, monospace' }}>
                        {l.producto.codigoBarras ?? 'sin código'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{l.producto.stock}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={l.cantidad}
                        error={!valida}
                        onChange={(e) => cambiarLinea(l.producto.id, 'cantidad', e.target.value)}
                        slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': `Cantidad de ${l.producto.nombre}` } }}
                      />
                    </TableCell>
                    {conCostos && (
                      <TableCell>
                        <CampoDinero
                          size="small"
                          valor={l.costo}
                          alCambiar={(v) => cambiarLinea(l.producto.id, 'costo', v)}
                          placeholder="Opcional"
                        />
                      </TableCell>
                    )}
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {valida ? l.producto.stock + cantidad : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Quitar">
                        <IconButton
                          aria-label={`Quitar ${l.producto.nombre}`}
                          onClick={() => setLineas((a) => a.filter((x) => x.producto.id !== l.producto.id))}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {lineas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={conCostos ? 6 : 5} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <LocalShippingOutlinedIcon sx={{ fontSize: 40, display: 'block', mx: 'auto', mb: 1 }} />
                    Todavía no cargaste productos. Pasá la pistola por el primero.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {lineas.length > 0 && (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ p: 2, borderTop: 1, borderColor: 'divider', alignItems: { md: 'center' } }}
          >
            <TextField
              size="small"
              label="Nota (opcional)"
              placeholder="Proveedor o número de remito"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              sx={{ flex: 1 }}
            />
            {conCostos && (
              <FormControlLabel
                control={<Switch checked={actualizarCosto} onChange={(e) => setActualizarCosto(e.target.checked)} />}
                label="Actualizar el costo de los productos"
              />
            )}
            <Box sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatearNumero(totalUnidades)} unidades</Typography>
            </Box>
            <Button variant="contained" size="large" loading={enviando} onClick={() => void confirmar()}>
              Confirmar ingreso
            </Button>
          </Stack>
        )}
      </Card>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={6000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={aviso?.severidad ?? 'info'} variant="filled" onClose={() => setAviso(null)}>
          {aviso?.mensaje}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
