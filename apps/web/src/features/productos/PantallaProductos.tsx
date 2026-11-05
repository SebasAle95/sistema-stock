'use client';

import AddIcon from '@mui/icons-material/Add';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  formatearMoneda,
  type Categoria,
  type EstadoFiltroProductos,
  type Pagina,
  type Producto,
} from '@stock/shared';
import { useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { DialogoAjusteStock } from '@/features/stock/DialogoAjusteStock';
import { useConsulta } from '@/hooks/useConsulta';
import { pareceCodigoDeBarras, useLectorCodigoBarras } from '@/hooks/useLectorCodigoBarras';
import { useValorDiferido } from '@/hooks/useValorDiferido';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { ChipStock } from './ChipStock';
import { DialogoCategorias } from './DialogoCategorias';
import { DialogoProducto } from './DialogoProducto';

type Dialogo =
  | { tipo: 'crear'; codigo?: string }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'categorias' }
  | { tipo: 'ajustar'; producto: Producto }
  | null;

interface Aviso {
  severidad: AlertColor;
  mensaje: string;
}

const MONO = { fontFamily: 'ui-monospace, Consolas, monospace' };

export function PantallaProductos() {
  const { tienePermiso } = useSesion();
  const puedeGestionar = tienePermiso('productos.gestionar');
  const verCostos = tienePermiso('productos.ver_costos');
  const puedeAjustar = tienePermiso('stock.ajustar');
  const parametrosUrl = useSearchParams();

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const buscar = useValorDiferido(textoBusqueda.trim(), 300);
  const [categoriaId, setCategoriaId] = useState('');
  const [estado, setEstado] = useState<EstadoFiltroProductos>('activos');
  // Desde la alerta de Inicio se llega con ?stockBajo=1.
  const [soloStockBajo, setSoloStockBajo] = useState(parametrosUrl.get('stockBajo') === '1');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const refBuscador = useRef<HTMLInputElement>(null);

  const parametros = new URLSearchParams({ pagina: String(pagina + 1), porPagina: String(porPagina), estado });
  if (buscar) parametros.set('buscar', buscar);
  if (categoriaId) parametros.set('categoriaId', categoriaId);
  if (soloStockBajo) parametros.set('stockBajo', 'true');

  const productos = useConsulta<Pagina<Producto>>(`/productos?${parametros}`);
  const categorias = useConsulta<Categoria[]>('/categorias');
  const listaCategorias = categorias.datos ?? [];
  const hayFiltros = Boolean(buscar || categoriaId || soloStockBajo || estado !== 'activos');

  /** Lo que pasa al leer un código con la pistola (o escribirlo y apretar Enter). */
  const procesarCodigo = useCallback(
    async (codigo: string) => {
      try {
        const producto = await api.get<Producto>(`/productos/codigo/${encodeURIComponent(codigo)}`);
        if (puedeGestionar) setDialogo({ tipo: 'editar', producto });
        else
          setAviso({
            severidad: 'info',
            mensaje: `${producto.nombre}: ${formatearMoneda(producto.precioVenta)} · stock ${producto.stock}`,
          });
      } catch (error) {
        if (error instanceof ErrorDeApi && error.status === 404) {
          if (puedeGestionar) setDialogo({ tipo: 'crear', codigo });
          else setAviso({ severidad: 'warning', mensaje: `No hay ningún producto con el código ${codigo}` });
        } else {
          setAviso({ severidad: 'error', mensaje: mensajeDeError(error) });
        }
      }
    },
    [puedeGestionar],
  );

  useLectorCodigoBarras((codigo) => void procesarCodigo(codigo), dialogo === null);

  function cerrarDialogo() {
    setDialogo(null);
    setTimeout(() => refBuscador.current?.focus(), 0);
  }

  function alGuardarProducto(producto: Producto, creado: boolean) {
    cerrarDialogo();
    setAviso({ severidad: 'success', mensaje: `"${producto.nombre}" ${creado ? 'creado' : 'guardado'}.` });
    productos.recargar();
    categorias.recargar();
  }

  const columnas = 4 + (verCostos ? 1 : 0) + (estado !== 'activos' ? 1 : 0) + (puedeGestionar ? 1 : 0);

  return (
    <Stack spacing={3}>
      <EncabezadoPagina
        titulo="Productos"
        descripcion={
          puedeGestionar
            ? 'Pasá la pistola por un producto: si existe se abre, si no, lo das de alta en el momento.'
            : 'Consultá precios y stock. Pasá la pistola para buscar un producto.'
        }
        accion={
          puedeGestionar && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<CategoryOutlinedIcon />} onClick={() => setDialogo({ tipo: 'categorias' })}>
                Categorías
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogo({ tipo: 'crear' })}>
                Nuevo producto
              </Button>
            </Stack>
          )
        }
      />

      <Card variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2, alignItems: { md: 'center' } }}>
          <TextField
            inputRef={refBuscador}
            autoFocus
            fullWidth
            size="small"
            placeholder="Buscar por nombre o escanear un código"
            value={textoBusqueda}
            onChange={(e) => {
              setTextoBusqueda(e.target.value);
              setPagina(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pareceCodigoDeBarras(textoBusqueda)) {
                e.preventDefault();
                const codigo = textoBusqueda.trim();
                setTextoBusqueda('');
                void procesarCodigo(codigo);
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Podés pasar la pistola en cualquier momento">
                      <QrCodeScannerIcon sx={{ color: 'text.secondary' }} />
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Categoría"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value);
              setPagina(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="sin">Sin categoría</MenuItem>
            {listaCategorias.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
          {puedeGestionar && (
            <TextField
              select
              size="small"
              label="Estado"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as EstadoFiltroProductos);
                setPagina(0);
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="activos">Activos</MenuItem>
              <MenuItem value="inactivos">Desactivados</MenuItem>
              <MenuItem value="todos">Todos</MenuItem>
            </TextField>
          )}
          <FormControlLabel
            sx={{ whiteSpace: 'nowrap', mr: 0 }}
            control={
              <Switch
                checked={soloStockBajo}
                onChange={(e) => {
                  setSoloStockBajo(e.target.checked);
                  setPagina(0);
                }}
              />
            }
            label="Stock bajo"
          />
        </Stack>

        <Box sx={{ height: 4 }}>{productos.cargando && <LinearProgress />}</Box>
        {productos.error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {productos.error}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Precio</TableCell>
                {verCostos && <TableCell align="right">Costo</TableCell>}
                <TableCell align="center">Stock</TableCell>
                {estado !== 'activos' && <TableCell>Estado</TableCell>}
                {puedeGestionar && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.datos?.items.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  onClick={puedeGestionar ? () => setDialogo({ tipo: 'editar', producto: p }) : undefined}
                  sx={{ cursor: puedeGestionar ? 'pointer' : 'default', opacity: p.activo ? 1 : 0.55 }}
                >
                  <TableCell sx={{ ...MONO, color: p.codigoBarras ? 'text.primary' : 'text.disabled' }}>
                    {p.codigoBarras ?? 'sin código'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 500 }}>{p.nombre}</Typography>
                      {p.accesoRapido && <Chip size="small" variant="outlined" color="secondary" label="Rápido" />}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {p.categoria?.nombre ?? 'Sin categoría'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatearMoneda(p.precioVenta)}
                  </TableCell>
                  {verCostos && (
                    <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {p.precioCosto != null ? formatearMoneda(p.precioCosto) : '—'}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <ChipStock stock={p.stock} stockMinimo={p.stockMinimo} controlaStock={p.controlaStock} />
                  </TableCell>
                  {estado !== 'activos' && (
                    <TableCell>{p.activo ? <Chip size="small" label="Activo" /> : <Chip size="small" label="Desactivado" />}</TableCell>
                  )}
                  {puedeGestionar && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {puedeAjustar && p.controlaStock && p.activo && (
                        <Tooltip title="Ajustar stock o registrar merma">
                          <IconButton
                            aria-label={`Ajustar stock de ${p.nombre}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialogo({ tipo: 'ajustar', producto: p });
                            }}
                          >
                            <TuneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton aria-label={`Editar ${p.nombre}`}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {productos.datos && productos.datos.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnas} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    {hayFiltros
                      ? 'No hay productos que coincidan con la búsqueda.'
                      : puedeGestionar
                        ? 'Todavía no hay productos. Pasá la pistola por uno para darlo de alta, o tocá "Nuevo producto".'
                        : 'Todavía no hay productos cargados.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={productos.datos?.total ?? 0}
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

      {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
        <DialogoProducto
          producto={dialogo.tipo === 'editar' ? dialogo.producto : undefined}
          codigoInicial={dialogo.tipo === 'crear' ? dialogo.codigo : undefined}
          categorias={listaCategorias}
          alCrearCategoria={() => categorias.recargar()}
          alCerrar={cerrarDialogo}
          alGuardar={alGuardarProducto}
        />
      )}
      {dialogo?.tipo === 'ajustar' && (
        <DialogoAjusteStock
          producto={dialogo.producto}
          alCerrar={cerrarDialogo}
          alGuardar={(mensaje) => {
            cerrarDialogo();
            setAviso({ severidad: 'success', mensaje });
            productos.recargar();
          }}
        />
      )}
      {dialogo?.tipo === 'categorias' && (
        <DialogoCategorias
          categorias={listaCategorias}
          alCambiar={() => {
            categorias.recargar();
            productos.recargar();
          }}
          alCerrar={cerrarDialogo}
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
    </Stack>
  );
}
