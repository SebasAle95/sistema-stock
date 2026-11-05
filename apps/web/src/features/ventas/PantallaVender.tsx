'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatearMoneda, type Caja, type Pagina, type Producto, type Venta } from '@stock/shared';
import { useRef, useState } from 'react';
import { FormularioAbrirCaja } from '@/features/caja/FormularioAbrirCaja';
import { BuscadorProductos } from '@/features/productos/BuscadorProductos';
import { useConsulta } from '@/hooks/useConsulta';
import { DialogoCobro } from './DialogoCobro';

interface Linea {
  producto: Producto;
  cantidad: number;
}

interface Aviso {
  severidad: AlertColor;
  mensaje: string;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Botones de los productos marcados como "rápidos" (lo que no tiene código). */
function BotonesRapidos({ alElegir }: { alElegir: (p: Producto) => void }) {
  const { datos } = useConsulta<Pagina<Producto>>('/productos?accesoRapido=true&porPagina=24');
  if (!datos || datos.items.length === 0) return null;
  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Botones rápidos
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', mt: 0.5 }}>
        {datos.items.map((p) => (
          <ButtonBase
            key={p.id}
            onClick={() => alElegir(p)}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              minHeight: 76,
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography sx={{ fontWeight: 600, lineHeight: 1.25 }}>{p.nombre}</Typography>
            <Typography sx={{ color: 'text.secondary', mt: 'auto' }}>{formatearMoneda(p.precioVenta)}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

/** Pantalla de venta: pistola o botones → carrito → cobrar. */
export function PantallaVender() {
  const caja = useConsulta<Caja | null>('/caja/actual');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const refBuscador = useRef<HTMLInputElement>(null);

  const total = redondear(lineas.reduce((suma, l) => suma + l.producto.precioVenta * l.cantidad, 0));
  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  function agregar(producto: Producto) {
    if (!producto.activo) return setAviso({ severidad: 'warning', mensaje: `"${producto.nombre}" está desactivado.` });
    setLineas((actuales) => {
      const existente = actuales.find((l) => l.producto.id === producto.id);
      if (existente) return actuales.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + 1 } : l));
      return [...actuales, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id: string, delta: number) {
    setLineas((actuales) =>
      actuales.flatMap((l) => {
        if (l.producto.id !== id) return [l];
        const cantidad = l.cantidad + delta;
        return cantidad > 0 ? [{ ...l, cantidad }] : [];
      }),
    );
  }

  function alCobrar(venta: Venta) {
    setCobrando(false);
    setLineas([]);
    caja.recargar();
    setAviso({
      severidad: 'success',
      mensaje: `Venta #${venta.numero} cobrada: ${formatearMoneda(venta.total)}${venta.vuelto ? ` · Vuelto ${formatearMoneda(venta.vuelto)}` : ''}`,
    });
    setTimeout(() => refBuscador.current?.focus(), 0);
  }

  if (caja.datos === undefined) return <CircularProgress aria-label="Cargando" />;
  if (caja.datos === null) return <FormularioAbrirCaja alAbrir={() => caja.recargar()} />;

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, alignItems: 'start' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Vender
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Caja #{caja.datos.numero} · abierta por {caja.datos.abiertaPor.nombre}
          </Typography>
        </Box>
        <Card variant="outlined" sx={{ p: 2 }}>
          <BuscadorProductos
            inputRef={refBuscador}
            pausado={cobrando}
            alElegir={agregar}
            alNoEncontrar={(codigo) => setAviso({ severidad: 'warning', mensaje: `No hay ningún producto con el código ${codigo}.` })}
            alError={(mensaje) => setAviso({ severidad: 'error', mensaje })}
          />
        </Card>
        <BotonesRapidos alElegir={agregar} />
      </Stack>

      <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
        <Stack direction="row" sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Venta actual</Typography>
          {lineas.length > 0 && (
            <Button size="small" color="inherit" onClick={() => setLineas([])}>
              Vaciar
            </Button>
          )}
        </Stack>
        <Divider />

        {lineas.length === 0 ? (
          <Box sx={{ py: 6, px: 2, textAlign: 'center', color: 'text.secondary' }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 44, mb: 1 }} />
            <Typography>Pasá la pistola o tocá un botón rápido para empezar.</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />} sx={{ maxHeight: { lg: '50vh' }, overflowY: 'auto' }}>
            {lineas.map(({ producto, cantidad }) => {
              const sinStock = producto.controlaStock && cantidad > producto.stock;
              return (
                <Stack key={producto.id} direction="row" spacing={1} sx={{ px: 2, py: 1.25, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 500 }} noWrap>
                      {producto.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ color: sinStock ? 'warning.main' : 'text.secondary' }}>
                      {formatearMoneda(producto.precioVenta)}
                      {sinStock && ` · el sistema tiene ${producto.stock} en stock`}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label={`Restar ${producto.nombre}`} onClick={() => cambiarCantidad(producto.id, -1)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{cantidad}</Typography>
                  <IconButton size="small" aria-label={`Sumar ${producto.nombre}`} onClick={() => cambiarCantidad(producto.id, 1)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 84, textAlign: 'right', fontWeight: 600 }}>
                    {formatearMoneda(redondear(producto.precioVenta * cantidad))}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Quitar ${producto.nombre}`}
                    onClick={() => cambiarCantidad(producto.id, -cantidad)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}

        <Divider />
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ color: 'text.secondary' }}>
              {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
            </Typography>
            <Typography variant="h4" component="p" sx={{ fontWeight: 800 }}>
              {formatearMoneda(total)}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            size="large"
            disabled={lineas.length === 0}
            onClick={() => setCobrando(true)}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            Cobrar
          </Button>
        </Stack>
      </Card>

      {cobrando && (
        <DialogoCobro
          total={total}
          items={lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad }))}
          alCerrar={() => {
            setCobrando(false);
            setTimeout(() => refBuscador.current?.focus(), 0);
          }}
          alCobrar={alCobrar}
        />
      )}

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
    </Box>
  );
}
