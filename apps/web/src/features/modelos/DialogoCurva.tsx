'use client';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  formatearMoneda,
  formatearNumero,
  tieneFuncionalidad,
  type Categoria,
  type Modelo,
  type Producto,
} from '@stock/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useSesion } from '@/features/auth/SesionProvider';
import { ChipStock } from '@/features/productos/ChipStock';
import { DialogoProducto } from '@/features/productos/DialogoProducto';
import { DialogoAjusteStock } from '@/features/stock/DialogoAjusteStock';
import { useConsulta } from '@/hooks/useConsulta';
import { claveCombinacion } from './GrillaStock';
import { DialogoModelo } from './DialogoModelo';
import { MuestraColor } from './MuestraColor';

interface Props {
  modeloId: string;
  categorias: Categoria[];
  alCrearCategoria: (categoria: Categoria) => void;
  alCerrar: () => void;
  /** Se llama después de cualquier cambio, para refrescar el listado de atrás. */
  alCambiar: (mensaje: string) => void;
}

type Abierto =
  | { tipo: 'menu'; ancla: HTMLElement; producto: Producto }
  | { tipo: 'editarCombinacion'; producto: Producto }
  | { tipo: 'ajustar'; producto: Producto }
  | { tipo: 'editarModelo'; modelo: Modelo }
  | { tipo: 'agregar'; modelo: Modelo }
  | null;

const suma = (productos: Producto[]) => productos.reduce((total, p) => total + (p.activo ? p.stock : 0), 0);

/** Stock de un modelo por talle y color, con totales. Desde acá se edita el modelo o cada combinación. */
export function DialogoCurva({ modeloId, categorias, alCrearCategoria, alCerrar, alCambiar }: Props) {
  const { tienePermiso } = useSesion();
  const puedeGestionar = tienePermiso('productos.gestionar');
  const puedeAjustar = tienePermiso('stock.ajustar');
  const conEtiquetas = tieneFuncionalidad('etiquetas') && tienePermiso('stock.ingresar');
  const tema = useTheme();
  const pantallaChica = useMediaQuery(tema.breakpoints.down('sm'));

  const consulta = useConsulta<Modelo>(`/modelos/${modeloId}`);
  const modelo = consulta.datos;
  const [abierto, setAbierto] = useState<Abierto>(null);

  function despuesDeCambiar(mensaje: string) {
    setAbierto(null);
    consulta.recargar();
    alCambiar(mensaje);
  }

  const filas = modelo && modelo.colores.length > 0 ? modelo.colores : [null];
  const columnas = modelo && modelo.talles.length > 0 ? modelo.talles : [null];
  const porClave = new Map(modelo?.variantes.map((v) => [claveCombinacion(v.talle, v.color), v]));
  const deFila = (color: string | null) => modelo?.variantes.filter((v) => v.color === color) ?? [];
  const deColumna = (talle: string | null) => modelo?.variantes.filter((v) => v.talle === talle) ?? [];
  const interactivo = puedeGestionar || puedeAjustar;

  return (
    <>
      <Dialog open onClose={alCerrar} fullWidth maxWidth="md" fullScreen={pantallaChica}>
        <DialogTitle sx={{ pb: 1 }}>
          {modelo?.nombre ?? 'Modelo'}
          {modelo && (
            <Typography sx={{ color: 'text.secondary' }}>
              {[
                modelo.categoria?.nombre ?? 'Sin categoría',
                formatearMoneda(modelo.precioVenta),
                `${formatearNumero(suma(modelo.variantes))} unidades`,
              ].join(' · ')}
            </Typography>
          )}
        </DialogTitle>
        <Box sx={{ height: 4 }}>{consulta.cargando && <LinearProgress />}</Box>
        <DialogContent>
          {consulta.error && <Alert severity="error">{consulta.error}</Alert>}

          {modelo && (
            <Stack spacing={2}>
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{modelo.colores.length > 0 ? 'Color' : ''}</TableCell>
                      {columnas.map((talle) => (
                        <TableCell key={talle ?? 'sin-talle'} align="center">
                          {talle ?? 'Stock'}
                        </TableCell>
                      ))}
                      {columnas.length > 1 && <TableCell align="center">Total</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filas.map((color) => (
                      <TableRow key={color ?? 'sin-color'}>
                        <TableCell component="th" scope="row">
                          {color ? (
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <MuestraColor color={color} />
                              <span>{color}</span>
                            </Stack>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Sin color
                            </Typography>
                          )}
                        </TableCell>
                        {columnas.map((talle) => {
                          const variante = porClave.get(claveCombinacion(talle, color));
                          return (
                            <TableCell key={claveCombinacion(talle, color)} align="center" sx={{ py: 0.75 }}>
                              {variante && interactivo ? (
                                <ButtonBase
                                  focusRipple
                                  onClick={(e) => setAbierto({ tipo: 'menu', ancla: e.currentTarget, producto: variante })}
                                  aria-label={`Opciones de ${variante.nombre}`}
                                  sx={{ borderRadius: 4, opacity: variante.activo ? 1 : 0.45 }}
                                >
                                  <ChipStock stock={variante.stock} stockMinimo={variante.stockMinimo} />
                                </ButtonBase>
                              ) : variante ? (
                                <Box component="span" sx={{ opacity: variante.activo ? 1 : 0.45 }}>
                                  <ChipStock stock={variante.stock} stockMinimo={variante.stockMinimo} />
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                  —
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                        {columnas.length > 1 && (
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            {formatearNumero(suma(deFila(color)))}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                  {filas.length > 1 && (
                    <TableFooter>
                      <TableRow sx={{ '& td': { fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' } }}>
                        <TableCell>Total</TableCell>
                        {columnas.map((talle) => (
                          <TableCell key={talle ?? 'sin-talle'} align="center">
                            {formatearNumero(suma(deColumna(talle)))}
                          </TableCell>
                        ))}
                        {columnas.length > 1 && <TableCell align="center">{formatearNumero(suma(modelo.variantes))}</TableCell>}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </TableContainer>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {interactivo
                  ? 'Tocá una combinación para ver su código, cambiar su precio, ajustar su stock o desactivarla. '
                  : ''}
                En rojo, sin stock; en naranja, en el mínimo o por debajo. Las desactivadas se ven apagadas y no suman.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          {modelo && conEtiquetas && (
            <Button component={Link} href={`/etiquetas?modelo=${modelo.id}`} startIcon={<LocalOfferOutlinedIcon />} sx={{ mr: 'auto' }}>
              Imprimir etiquetas
            </Button>
          )}
          {modelo && puedeGestionar && (
            <>
              <Button startIcon={<AddIcon />} onClick={() => setAbierto({ tipo: 'agregar', modelo })}>
                Talles o colores
              </Button>
              <Button startIcon={<EditOutlinedIcon />} onClick={() => setAbierto({ tipo: 'editarModelo', modelo })}>
                Editar modelo
              </Button>
            </>
          )}
          <Button variant="contained" onClick={alCerrar}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={abierto?.tipo === 'menu'}
        anchorEl={abierto?.tipo === 'menu' ? abierto.ancla : null}
        onClose={() => setAbierto(null)}
      >
        {abierto?.tipo === 'menu' && [
          <MenuItem key="titulo" disabled sx={{ '&.Mui-disabled': { opacity: 1 } }}>
            <ListItemText
              primary={[abierto.producto.color, abierto.producto.talle].filter(Boolean).join(' · ')}
              secondary={`${abierto.producto.codigoBarras ?? 'Sin código'} · ${formatearMoneda(abierto.producto.precioVenta)}`}
              slotProps={{ secondary: { sx: { fontFamily: 'ui-monospace, Consolas, monospace' } } }}
            />
          </MenuItem>,
          puedeGestionar && (
            <MenuItem key="editar" onClick={() => setAbierto({ tipo: 'editarCombinacion', producto: abierto.producto })}>
              Editar combinación
            </MenuItem>
          ),
          puedeAjustar && abierto.producto.activo && (
            <MenuItem key="ajustar" onClick={() => setAbierto({ tipo: 'ajustar', producto: abierto.producto })}>
              Ajustar stock o registrar merma
            </MenuItem>
          ),
        ]}
      </Menu>

      {abierto?.tipo === 'editarCombinacion' && (
        <DialogoProducto
          producto={abierto.producto}
          categorias={categorias}
          alCrearCategoria={alCrearCategoria}
          alCerrar={() => setAbierto(null)}
          alGuardar={(producto) => despuesDeCambiar(`"${producto.nombre}" guardado.`)}
        />
      )}
      {abierto?.tipo === 'ajustar' && (
        <DialogoAjusteStock producto={abierto.producto} alCerrar={() => setAbierto(null)} alGuardar={despuesDeCambiar} />
      )}
      {(abierto?.tipo === 'editarModelo' || abierto?.tipo === 'agregar') && (
        <DialogoModelo
          modo={abierto.tipo === 'editarModelo' ? 'editar' : 'agregar'}
          modelo={abierto.modelo}
          categorias={categorias}
          alCrearCategoria={alCrearCategoria}
          alCerrar={() => setAbierto(null)}
          alGuardar={(_, mensaje) => despuesDeCambiar(mensaje)}
        />
      )}
    </>
  );
}
