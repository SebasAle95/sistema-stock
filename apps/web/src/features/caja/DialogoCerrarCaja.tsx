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
import Typography from '@mui/material/Typography';
import { erroresDeCampos, esquemaCerrarCaja, formatearMoneda, parsearNumero, type Caja } from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { api, mensajeDeError } from '@/lib/apiClient';
import { ChipDiferencia } from './ChipDiferencia';

interface Props {
  caja: Caja;
  alCerrar: () => void;
  alCerrarCaja: (cerrada: Caja) => void;
}

/**
 * Cierre de caja. Con `caja.resumen` (admin) se ve el esperado y la diferencia
 * mientras se escribe; sin él (vendedor) es un cierre ciego: solo se carga lo contado.
 */
export function DialogoCerrarCaja({ caja, alCerrar, alCerrarCaja }: Props) {
  const [contado, setContado] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const numero = parsearNumero(contado);
  const valido = numero !== null && !Number.isNaN(numero);
  const esperado = caja.resumen?.efectivoEsperado;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const validacion = esquemaCerrarCaja.safeParse({ efectivoContado: valido ? numero : undefined, nota: nota || undefined });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).efectivoContado ?? 'Datos inválidos');

    setEnviando(true);
    try {
      alCerrarCaja(await api.post<Caja>('/caja/cerrar', validacion.data));
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>Cerrar caja #{caja.numero}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Contá todo el efectivo que hay en la caja (incluido el cambio inicial) y cargalo acá.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <CampoDinero
              label="Efectivo contado"
              autoFocus
              valor={contado}
              alCambiar={(v) => {
                setContado(v);
                setError(null);
              }}
            />
            {esperado !== undefined && (
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: 'text.secondary' }}>Debería haber {formatearMoneda(esperado)}</Typography>
                {valido && <ChipDiferencia diferencia={Math.round((numero - esperado) * 100) / 100} />}
              </Stack>
            )}
            <TextField
              label="Nota (opcional)"
              placeholder="Por ejemplo: faltan $500 que se dieron de vuelto de más"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="warning" loading={enviando}>
            Cerrar caja
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
