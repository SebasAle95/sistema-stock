'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {
  erroresDeCampos,
  esquemaMovimientoCaja,
  parsearNumero,
  type ErroresDeCampos,
  type TipoMovimientoCaja,
} from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Props {
  alCerrar: () => void;
  alGuardar: (mensaje: string) => void;
}

/** Salida (pago a proveedor, retiro) o entrada (cambio extra) de efectivo que no es una venta. */
export function DialogoMovimientoCaja({ alCerrar, alGuardar }: Props) {
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('egreso');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const numero = parsearNumero(monto);
    const validacion = esquemaMovimientoCaja.safeParse({
      tipo,
      monto: numero === null || Number.isNaN(numero) ? undefined : numero,
      motivo,
    });
    if (!validacion.success) return setErrores(erroresDeCampos(validacion.error));

    setEnviando(true);
    try {
      await api.post('/caja/movimientos', validacion.data);
      alGuardar(tipo === 'egreso' ? 'Salida de efectivo registrada.' : 'Entrada de efectivo registrada.');
    } catch (e) {
      setMensaje(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>Movimiento de efectivo</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={tipo}
              onChange={(_, nuevo: TipoMovimientoCaja | null) => nuevo && setTipo(nuevo)}
            >
              <ToggleButton value="egreso">Sale plata</ToggleButton>
              <ToggleButton value="ingreso">Entra plata</ToggleButton>
            </ToggleButtonGroup>
            <CampoDinero
              label="Monto"
              autoFocus
              valor={monto}
              alCambiar={(v) => {
                setMonto(v);
                setErrores({});
              }}
              error={Boolean(errores.monto)}
              helperText={errores.monto}
            />
            <TextField
              label="Motivo"
              placeholder={tipo === 'egreso' ? 'Por ejemplo: pago al proveedor de hielo' : 'Por ejemplo: cambio que trajo el dueño'}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErrores({});
              }}
              error={Boolean(errores.motivo)}
              helperText={errores.motivo}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            Registrar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
