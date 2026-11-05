'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { formatearMoneda, MEDIO_EFECTIVO, negocio, parsearNumero, type Venta } from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Props {
  total: number;
  items: { productoId: string; cantidad: number }[];
  alCerrar: () => void;
  alCobrar: (venta: Venta) => void;
}

/** Billetes habituales para cobrar rápido en efectivo. */
const BILLETES = [1000, 2000, 5000, 10000, 20000];

export function DialogoCobro({ total, items, alCerrar, alCobrar }: Props) {
  const [medioPago, setMedioPago] = useState<string>(MEDIO_EFECTIVO);
  const [recibido, setRecibido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const montoRecibido = parsearNumero(recibido);
  const esEfectivo = medioPago === MEDIO_EFECTIVO;
  const recibidoValido = montoRecibido !== null && !Number.isNaN(montoRecibido);
  const vuelto = esEfectivo && recibidoValido ? montoRecibido - total : null;
  const sugeridos = BILLETES.filter((b) => b >= total).slice(0, 3);

  async function cobrar(evento?: FormEvent) {
    evento?.preventDefault();
    if (esEfectivo && recibido !== '' && !recibidoValido) return setError('El monto recibido no es un número válido');
    if (vuelto !== null && vuelto < 0) return setError('El monto recibido es menor que el total');

    setEnviando(true);
    try {
      const venta = await api.post<Venta>('/ventas', {
        items,
        medioPago,
        montoRecibido: esEfectivo && recibidoValido ? montoRecibido : null,
      });
      alCobrar(venta);
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={cobrar}>
        <DialogTitle>Cobrar</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>Total</Typography>
              <Typography variant="h3" component="p" sx={{ fontWeight: 800 }}>
                {formatearMoneda(total)}
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}

            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={medioPago}
              onChange={(_, nuevo: string | null) => {
                if (nuevo) {
                  setMedioPago(nuevo);
                  setError(null);
                }
              }}
            >
              {negocio.mediosDePago.map((m) => (
                <ToggleButton key={m.id} value={m.id} sx={{ py: 1.25 }}>
                  {m.nombre}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {esEfectivo && (
              <Stack spacing={1.5}>
                <CampoDinero
                  label="¿Con cuánto paga?"
                  autoFocus
                  valor={recibido}
                  alCambiar={(v) => {
                    setRecibido(v);
                    setError(null);
                  }}
                  helperText="Opcional: para calcular el vuelto."
                />
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={() => setRecibido(String(total))}>
                    Justo
                  </Button>
                  {sugeridos.map((b) => (
                    <Button key={b} variant="outlined" size="small" onClick={() => setRecibido(String(b))}>
                      {formatearMoneda(b)}
                    </Button>
                  ))}
                </Stack>
                {vuelto !== null && (
                  <Alert severity={vuelto < 0 ? 'error' : 'success'} icon={false}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                      {vuelto < 0 ? `Faltan ${formatearMoneda(-vuelto)}` : `Vuelto: ${formatearMoneda(vuelto)}`}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Volver
          </Button>
          <Button type="submit" variant="contained" size="large" loading={enviando}>
            Confirmar venta
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
