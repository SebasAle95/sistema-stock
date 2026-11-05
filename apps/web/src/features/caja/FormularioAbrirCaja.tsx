'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { esquemaAbrirCaja, erroresDeCampos, parsearNumero, type Caja } from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { useSesion } from '@/features/auth/SesionProvider';
import { api, mensajeDeError } from '@/lib/apiClient';

/** Tarjeta "La caja está cerrada" con el formulario para abrirla. */
export function FormularioAbrirCaja({ alAbrir }: { alAbrir: (caja: Caja) => void }) {
  const { tienePermiso } = useSesion();
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function abrir(evento: FormEvent) {
    evento.preventDefault();
    const numero = parsearNumero(monto);
    const validacion = esquemaAbrirCaja.safeParse({ montoInicial: numero === null || Number.isNaN(numero) ? undefined : numero });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).montoInicial ?? 'Monto inválido');

    setEnviando(true);
    try {
      alAbrir(await api.post<Caja>('/caja/abrir', validacion.data));
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ maxWidth: 480 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LockOutlinedIcon color="warning" />
            <Typography variant="h6">La caja está cerrada</Typography>
          </Stack>
          {tienePermiso('caja.operar') ? (
            <Stack component="form" spacing={2} onSubmit={abrir} noValidate>
              <Typography sx={{ color: 'text.secondary' }}>
                Para empezar a vender, abrí la caja con el efectivo que hay para dar cambio.
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <CampoDinero
                label="Efectivo inicial"
                autoFocus
                valor={monto}
                alCambiar={(v) => {
                  setMonto(v);
                  setError(null);
                }}
                helperText="Si no hay cambio, poné 0."
              />
              <Button type="submit" variant="contained" size="large" loading={enviando}>
                Abrir caja
              </Button>
            </Stack>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>Pedile a un responsable que abra la caja.</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
