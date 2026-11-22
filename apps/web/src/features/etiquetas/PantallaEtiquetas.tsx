'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import FormControlLabel from '@mui/material/FormControlLabel';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
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
import Typography from '@mui/material/Typography';
import {
  formatearMoneda,
  formatearNumero,
  tieneFuncionalidad,
  type Modelo,
  type Producto,
  type ResultadoCodigos,
} from '@stock/shared';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { BuscadorProductos } from '@/features/productos/BuscadorProductos';
import { api, mensajeDeError } from '@/lib/apiClient';
import { Etiqueta, FORMATOS, type Formato } from './Etiqueta';

interface Item {
  producto: Producto;
  /** Texto del campo "Copias". */
  copias: string;
}

interface Aviso {
  severidad: AlertColor;
  mensaje: string;
}

type ConCodigo = Producto & { codigoBarras: string };

const MAXIMO_ETIQUETAS = 2000;
const ID_HOJA = 'hoja-etiquetas';

const copiasValidas = (texto: string) => {
  const n = Number(texto.trim() || '0');
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

export function PantallaEtiquetas() {
  const { tienePermiso } = useSesion();
  const puedeGenerar = tienePermiso('productos.gestionar');
  const parametrosUrl = useSearchParams();
  const modeloInicial = parametrosUrl.get('modelo');

  const [items, setItems] = useState<Item[]>([]);
  const [formato, setFormato] = useState<Formato>('a4');
  const [conPrecio, setConPrecio] = useState(true);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [generando, setGenerando] = useState(false);
  // true solo en el navegador: la hoja para imprimir va directo en <body> (no existe en el servidor).
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Desde la curva de un modelo se llega con ?modelo=…: se cargan sus combinaciones, una etiqueta por unidad en stock.
  useEffect(() => {
    if (!modeloInicial || !tieneFuncionalidad('variantes')) return;
    let cancelado = false;
    api
      .get<Modelo>(`/modelos/${modeloInicial}`)
      .then((modelo) => {
        if (cancelado) return;
        setItems(
          modelo.variantes
            .filter((v) => v.activo)
            .map((producto) => ({ producto, copias: String(Math.max(producto.stock, 0)) })),
        );
      })
      .catch((error: unknown) => !cancelado && setAviso({ severidad: 'error', mensaje: mensajeDeError(error) }));
    return () => {
      cancelado = true;
    };
  }, [modeloInicial]);

  function agregar(producto: Producto) {
    setItems((actuales) => {
      const existente = actuales.find((i) => i.producto.id === producto.id);
      if (existente) {
        return actuales.map((i) => (i === existente ? { ...i, copias: String(copiasValidas(i.copias) + 1) } : i));
      }
      return [...actuales, { producto, copias: '1' }];
    });
  }

  const sinCodigo = items.filter((i) => !i.producto.codigoBarras);
  const etiquetas = items.flatMap((i) =>
    i.producto.codigoBarras ? Array<ConCodigo>(copiasValidas(i.copias)).fill(i.producto as ConCodigo) : [],
  );
  const demasiadas = etiquetas.length > MAXIMO_ETIQUETAS;
  const { porHoja } = FORMATOS[formato];
  const hojas = Math.ceil(etiquetas.length / porHoja);

  async function generarCodigos() {
    setGenerando(true);
    try {
      const resultado = await api.post<ResultadoCodigos>('/etiquetas/codigos', {
        productoIds: sinCodigo.map((i) => i.producto.id),
      });
      const nuevos = new Map(resultado.productos.map((p) => [p.id, p]));
      setItems((actuales) => actuales.map((i) => ({ ...i, producto: nuevos.get(i.producto.id) ?? i.producto })));
      setAviso({
        severidad: 'success',
        mensaje:
          resultado.asignados === 1 ? 'Se asignó 1 código interno.' : `Se asignaron ${resultado.asignados} códigos internos.`,
      });
    } catch (error) {
      setAviso({ severidad: 'error', mensaje: mensajeDeError(error) });
    } finally {
      setGenerando(false);
    }
  }

  const hoja = (
    <Box
      id={ID_HOJA}
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${FORMATOS[formato].columnas}, ${FORMATOS[formato].ancho}mm)`,
        gridAutoRows: `${FORMATOS[formato].alto}mm`,
        // En el rollo, cada etiqueta es una página.
        ...(formato === 'rollo' && { '& > *': { breakAfter: 'page' } }),
      }}
    >
      {etiquetas.map((producto, i) => (
        <Etiqueta key={i} producto={producto} formato={formato} conPrecio={conPrecio} />
      ))}
    </Box>
  );

  return (
    <Stack spacing={3}>
      <GlobalStyles
        styles={{
          [`#${ID_HOJA}`]: { display: 'none' },
          '@page': formato === 'a4' ? { size: 'A4', margin: 0 } : { size: '50mm 25mm', margin: 0 },
          '@media print': {
            [`body > *:not(#${ID_HOJA})`]: { display: 'none !important' },
            [`body > #${ID_HOJA}`]: { display: 'grid !important' },
            body: { background: '#fff !important' },
          },
        }}
      />

      <EncabezadoPagina
        titulo="Etiquetas"
        descripcion="Armá la lista de lo que querés etiquetar y elegí cuántas copias de cada una. Cada etiqueta lleva el código que lee la pistola."
        accion={
          <Button
            variant="contained"
            startIcon={<PrintOutlinedIcon />}
            disabled={etiquetas.length === 0 || demasiadas}
            onClick={() => window.print()}
          >
            Imprimir {etiquetas.length > 0 ? formatearNumero(etiquetas.length) : ''}
          </Button>
        }
      />

      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <BuscadorProductos
            alElegir={agregar}
            alNoEncontrar={(codigo) => setAviso({ severidad: 'warning', mensaje: `No hay ningún producto con el código ${codigo}` })}
            alError={(mensaje) => setAviso({ severidad: 'error', mensaje })}
            placeholder="Escaneá o buscá lo que querés etiquetar"
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <TextField
              select
              size="small"
              label="Formato"
              value={formato}
              onChange={(e) => setFormato(e.target.value as Formato)}
              sx={{ minWidth: 300 }}
            >
              {(Object.keys(FORMATOS) as Formato[]).map((f) => (
                <MenuItem key={f} value={f}>
                  {FORMATOS[f].nombre}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Switch checked={conPrecio} onChange={(e) => setConPrecio(e.target.checked)} />}
              label="Con precio"
            />
          </Stack>
        </Stack>
      </Card>

      {sinCodigo.length > 0 && (
        <Alert
          severity="warning"
          action={
            puedeGenerar && (
              <Button color="inherit" size="small" loading={generando} onClick={generarCodigos}>
                Generar códigos
              </Button>
            )
          }
        >
          {sinCodigo.length === 1 ? '1 producto no tiene código' : `${sinCodigo.length} productos no tienen código`} y no
          se puede etiquetar.{' '}
          {puedeGenerar
            ? 'Se les puede asignar un código interno: queda guardado y la pistola lo reconoce.'
            : 'Un administrador les puede asignar un código interno desde esta pantalla.'}
        </Alert>
      )}
      {demasiadas && (
        <Alert severity="error">
          Son {formatearNumero(etiquetas.length)} etiquetas. Imprimí de a {formatearNumero(MAXIMO_ETIQUETAS)} como máximo.
        </Alert>
      )}

      {items.length > 0 && (
        <Card variant="outlined">
          <TableContainer>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Copias</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.producto.id}>
                    <TableCell>{item.producto.nombre}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'ui-monospace, Consolas, monospace',
                        color: item.producto.codigoBarras ? 'text.primary' : 'warning.main',
                      }}
                    >
                      {item.producto.codigoBarras ?? 'sin código'}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {formatearMoneda(item.producto.precioVenta)}
                    </TableCell>
                    <TableCell align="center">{formatearNumero(item.producto.stock)}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <TextField
                        size="small"
                        value={item.copias}
                        onChange={(e) =>
                          setItems((actuales) =>
                            actuales.map((i) => (i === item ? { ...i, copias: e.target.value.replace(/\D/g, '') } : i)),
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            inputMode: 'numeric',
                            'aria-label': `Copias de ${item.producto.nombre}`,
                            style: { textAlign: 'center', width: 48 },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Quitar ${item.producto.nombre}`}
                        onClick={() => setItems((actuales) => actuales.filter((i) => i !== item))}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatearNumero(etiquetas.length)} {etiquetas.length === 1 ? 'etiqueta' : 'etiquetas'}
              {formato === 'a4' && etiquetas.length > 0 && ` · ${hojas} ${hojas === 1 ? 'hoja' : 'hojas'}`}
            </Typography>
            <Button color="inherit" onClick={() => setItems([])}>
              Vaciar lista
            </Button>
          </Stack>
        </Card>
      )}

      {items.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
          Todavía no hay nada para etiquetar. Pasá la pistola, buscá un producto, o abrí un modelo y tocá &quot;Imprimir
          etiquetas&quot;.
        </Typography>
      )}

      {etiquetas.length > 0 && !demasiadas && (
        <Box>
          <Typography variant="overline" component="h2" sx={{ color: 'text.secondary' }}>
            Vista previa · tamaño real
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              overflowX: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '3mm',
            }}
          >
            {etiquetas.slice(0, 12).map((producto, i) => (
              <Box key={i} sx={{ boxShadow: 1, flexShrink: 0 }}>
                <Etiqueta producto={producto} formato={formato} conPrecio={conPrecio} />
              </Box>
            ))}
          </Box>
          {etiquetas.length > 12 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Se muestran las primeras 12 de {formatearNumero(etiquetas.length)}.
            </Typography>
          )}
        </Box>
      )}

      {/* La hoja que se imprime: directo en <body>, para ocultar todo lo demás al imprimir. */}
      {montado && !demasiadas && createPortal(hoja, document.body)}

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
