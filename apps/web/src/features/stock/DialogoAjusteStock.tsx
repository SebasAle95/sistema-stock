'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  erroresDeCampos,
  esquemaAjusteStock,
  MOTIVOS_MERMA,
  parsearNumero,
  type ErroresDeCampos,
  type Producto,
} from '@stock/shared';
import { useRef, useState, type FormEvent } from 'react';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Props {
  producto: Producto;
  alCerrar: () => void;
  alGuardar: (mensaje: string) => void;
}

/** Ajuste (se contó el stock real) o merma (vencidos, rotos, consumo interno). */
export function DialogoAjusteStock({ producto, alCerrar, alGuardar }: Props) {
  const [tipo, setTipo] = useState<'ajuste' | 'merma'>('ajuste');
  const refCantidad = useRef<HTMLInputElement>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<string>(MOTIVOS_MERMA[0]);
  const [detalle, setDetalle] = useState('');
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const numero = parsearNumero(cantidad);
  const valido = numero !== null && !Number.isNaN(numero);
  const resultado = !valido ? null : tipo === 'ajuste' ? numero : producto.stock - numero;
  const diferencia = resultado === null ? null : resultado - producto.stock;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);
    const nota = tipo === 'merma' ? [motivo, detalle.trim()].filter(Boolean).join(': ') : detalle.trim() || undefined;
    const datos =
      tipo === 'ajuste'
        ? { tipo, productoId: producto.id, stockReal: numero, nota }
        : { tipo, productoId: producto.id, cantidad: numero, nota };

    const validacion = esquemaAjusteStock.safeParse(datos);
    if (!validacion.success) {
      const porCampo = erroresDeCampos(validacion.error);
      return setErrores({ cantidad: porCampo.stockReal ?? porCampo.cantidad, detalle: porCampo.nota });
    }

    setEnviando(true);
    try {
      const r = await api.post<{ stockAnterior: number; stockResultante: number }>('/stock/ajustes', validacion.data);
      alGuardar(`${producto.nombre}: stock ${r.stockAnterior} → ${r.stockResultante}.`);
    } catch (error) {
      setMensaje(mensajeDeError(error));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>Ajustar stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{producto.nombre}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Stock en el sistema: {producto.stock}
              </Typography>
            </Box>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}

            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={tipo}
              onChange={(_, nuevo: 'ajuste' | 'merma' | null) => {
                if (nuevo) {
                  setTipo(nuevo);
                  setErrores({});
                  // Al elegir la opción, el cursor pasa directo al campo de unidades.
                  refCantidad.current?.focus();
                }
              }}
            >
              <ToggleButton value="ajuste">Conté el stock</ToggleButton>
              <ToggleButton value="merma">Merma</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={tipo === 'ajuste' ? 'Unidades que hay realmente' : 'Unidades a descontar'}
              autoFocus
              inputRef={refCantidad}
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value);
                setErrores({});
              }}
              error={Boolean(errores.cantidad)}
              helperText={
                errores.cantidad ??
                (diferencia === null
                  ? ' '
                  : `Queda en ${resultado} (${diferencia > 0 ? '+' : ''}${diferencia} ${Math.abs(diferencia) === 1 ? 'unidad' : 'unidades'})`)
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />

            {tipo === 'merma' && (
              <TextField select label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS_MERMA.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label={tipo === 'merma' ? 'Detalle (opcional)' : 'Nota (opcional)'}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              error={Boolean(errores.detalle)}
              helperText={errores.detalle}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            Guardar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
