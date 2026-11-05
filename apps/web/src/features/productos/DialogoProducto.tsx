'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  erroresDeCampos,
  erroresDeCamposDeApi,
  esquemaCrearProducto,
  esquemaEditarProducto,
  formatearMoneda,
  formatearPorcentaje,
  parsearNumero,
  type Categoria,
  type ErroresDeCampos,
  type Producto,
} from '@stock/shared';
import { useRef, useState, type FormEvent } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { SelectorCategoria } from './SelectorCategoria';

interface Props {
  /** Producto a editar. Si no se pasa, se crea uno nuevo. */
  producto?: Producto;
  /** Código leído con la pistola, para precargarlo al crear. */
  codigoInicial?: string;
  categorias: Categoria[];
  alCrearCategoria: (categoria: Categoria) => void;
  alCerrar: () => void;
  alGuardar: (producto: Producto, creado: boolean) => void;
}

const texto = (valor: number | null | undefined) => (valor === null || valor === undefined ? '' : String(valor));

/** Muestra cuánto se gana por unidad, si hay costo y precio. */
function Ganancia({ venta, costo }: { venta: number | null; costo: number | null }) {
  if (venta === null || costo === null || Number.isNaN(venta) || Number.isNaN(costo)) return null;
  const ganancia = venta - costo;
  const sobreCosto = costo > 0 ? ` (${formatearPorcentaje(ganancia / costo)} sobre el costo)` : '';
  return (
    <Typography variant="body2" sx={{ color: ganancia < 0 ? 'error.main' : 'success.main', fontWeight: 500 }}>
      {ganancia < 0 ? 'Pérdida' : 'Ganancia'}: {formatearMoneda(Math.abs(ganancia))} por unidad{sobreCosto}
    </Typography>
  );
}

export function DialogoProducto({ producto, codigoInicial, categorias, alCrearCategoria, alCerrar, alGuardar }: Props) {
  const editando = Boolean(producto);
  const refNombre = useRef<HTMLInputElement>(null);

  const [valores, setValores] = useState({
    codigoBarras: producto?.codigoBarras ?? codigoInicial ?? '',
    nombre: producto?.nombre ?? '',
    categoriaId: producto?.categoria?.id ?? null,
    precioVenta: texto(producto?.precioVenta),
    precioCosto: texto(producto?.precioCosto),
    stockInicial: '',
    stockMinimo: texto(producto?.stockMinimo ?? 0),
    controlaStock: producto?.controlaStock ?? true,
    accesoRapido: producto?.accesoRapido ?? false,
    activo: producto?.activo ?? true,
  });
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar<C extends keyof typeof valores>(campo: C, valor: (typeof valores)[C]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }

  const numeros = {
    precioVenta: parsearNumero(valores.precioVenta),
    precioCosto: parsearNumero(valores.precioCosto),
    stockInicial: parsearNumero(valores.stockInicial) ?? 0,
    stockMinimo: parsearNumero(valores.stockMinimo) ?? 0,
  };

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);

    const invalidos = Object.entries(numeros).filter(([, n]) => n !== null && Number.isNaN(n));
    if (invalidos.length > 0) {
      setErrores(Object.fromEntries(invalidos.map(([campo]) => [campo, 'Ingresá un número válido'])));
      return;
    }

    const datos = {
      nombre: valores.nombre,
      codigoBarras: valores.codigoBarras,
      categoriaId: valores.categoriaId,
      precioVenta: numeros.precioVenta,
      precioCosto: numeros.precioCosto,
      stockMinimo: numeros.stockMinimo,
      controlaStock: valores.controlaStock,
      accesoRapido: valores.accesoRapido,
    };

    const validacion = producto
      ? esquemaEditarProducto.safeParse({ ...datos, activo: valores.activo })
      : esquemaCrearProducto.safeParse({ ...datos, stockInicial: numeros.stockInicial });
    if (!validacion.success) {
      setErrores(erroresDeCampos(validacion.error));
      return;
    }

    setEnviando(true);
    try {
      const guardado = producto
        ? await api.patch<Producto>(`/productos/${producto.id}`, validacion.data)
        : await api.post<Producto>('/productos', validacion.data);
      alGuardar(guardado, !producto);
    } catch (error) {
      const deCampos = error instanceof ErrorDeApi ? erroresDeCamposDeApi(error.detalles) : {};
      if (Object.keys(deCampos).length > 0) setErrores(deCampos);
      else setMensaje(mensajeDeError(error));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>{editando ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}
            {codigoInicial && !editando && (
              <Alert severity="info">No hay ningún producto con el código {codigoInicial}. Completá los datos para darlo de alta.</Alert>
            )}

            <TextField
              label="Código de barras"
              fullWidth
              autoFocus={!codigoInicial && !editando}
              value={valores.codigoBarras}
              onChange={(e) => cambiar('codigoBarras', e.target.value)}
              // La pistola manda Enter al final: en vez de enviar el formulario, pasa al nombre.
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refNombre.current?.focus();
                }
              }}
              error={Boolean(errores.codigoBarras)}
              helperText={errores.codigoBarras ?? 'Escaneá el producto o escribí el código. Puede quedar vacío.'}
              slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'ui-monospace, Consolas, monospace' } } }}
            />

            <TextField
              label="Nombre"
              fullWidth
              inputRef={refNombre}
              autoFocus={Boolean(codigoInicial) || editando}
              value={valores.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              error={Boolean(errores.nombre)}
              helperText={errores.nombre ?? 'Por ejemplo: Coca-Cola 500 ml'}
            />

            <SelectorCategoria
              categorias={categorias}
              valor={valores.categoriaId}
              alCambiar={(id) => cambiar('categoriaId', id)}
              alCrear={alCrearCategoria}
              error={errores.categoriaId}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <CampoDinero
                label="Precio de venta"
                fullWidth
                valor={valores.precioVenta}
                alCambiar={(v) => cambiar('precioVenta', v)}
                error={Boolean(errores.precioVenta)}
                helperText={errores.precioVenta}
              />
              <CampoDinero
                label="Precio de costo"
                fullWidth
                valor={valores.precioCosto}
                alCambiar={(v) => cambiar('precioCosto', v)}
                error={Boolean(errores.precioCosto)}
                helperText={errores.precioCosto ?? 'Opcional. Solo lo ven los administradores.'}
              />
            </Stack>
            <Ganancia venta={numeros.precioVenta} costo={numeros.precioCosto} />

            <Box>
              <FormControlLabel
                control={<Switch checked={valores.controlaStock} onChange={(e) => cambiar('controlaStock', e.target.checked)} />}
                label="Controlar stock"
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {valores.controlaStock
                  ? 'Se cuentan las unidades y avisa cuando quedan pocas.'
                  : 'Para lo que se prepara en el momento (café, sándwich): no lleva stock.'}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ display: valores.controlaStock ? 'flex' : 'none' }}
            >
              {!editando && (
                <TextField
                  label="Stock inicial"
                  fullWidth
                  value={valores.stockInicial}
                  onChange={(e) => cambiar('stockInicial', e.target.value)}
                  error={Boolean(errores.stockInicial)}
                  helperText={errores.stockInicial ?? 'Unidades que hay hoy.'}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              )}
              <TextField
                label="Stock mínimo"
                fullWidth
                value={valores.stockMinimo}
                onChange={(e) => cambiar('stockMinimo', e.target.value)}
                error={Boolean(errores.stockMinimo)}
                helperText={errores.stockMinimo ?? 'Avisa cuando quedan estas unidades o menos.'}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Stack>
            {editando && producto && valores.controlaStock && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Stock actual: <strong>{producto.stock}</strong>. Se modifica con ingresos de mercadería, ventas y ajustes.
              </Typography>
            )}

            <Box>
              <FormControlLabel
                control={<Switch checked={valores.accesoRapido} onChange={(e) => cambiar('accesoRapido', e.target.checked)} />}
                label="Botón rápido en la pantalla de venta"
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ideal para lo que no tiene código: sándwiches, café, porciones.
              </Typography>
            </Box>

            {editando && (
              <Box>
                <FormControlLabel
                  control={<Switch checked={valores.activo} onChange={(e) => cambiar('activo', e.target.checked)} />}
                  label={valores.activo ? 'Activo' : 'Desactivado'}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Un producto desactivado no se puede vender, pero se conserva su historial.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            {editando ? 'Guardar' : 'Crear producto'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
