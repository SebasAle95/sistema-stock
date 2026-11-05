'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { erroresDeCampos, erroresDeCamposDeApi, esquemaRestablecerPassword, type Usuario } from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { generarPasswordTemporal } from '@/lib/passwords';
import { CampoPasswordTemporal } from './CampoPasswordTemporal';

interface Props {
  usuario: Usuario;
  alCerrar: () => void;
  alGuardar: (mensaje: string) => void;
}

export function DialogoRestablecerPassword({ usuario, alCerrar, alGuardar }: Props) {
  const [passwordTemporal, setPasswordTemporal] = useState(generarPasswordTemporal);
  const [error, setError] = useState<string | undefined>();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);

    const validacion = esquemaRestablecerPassword.safeParse({ passwordTemporal });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).passwordTemporal);

    setEnviando(true);
    try {
      await api.post(`/usuarios/${usuario.id}/restablecer-password`, validacion.data);
      alGuardar(`Contraseña de "${usuario.usuario}" restablecida. Pasale la temporal: ${passwordTemporal}`);
    } catch (e) {
      const deCampos = e instanceof ErrorDeApi ? erroresDeCamposDeApi(e.detalles) : {};
      if (deCampos.passwordTemporal) setError(deCampos.passwordTemporal);
      else setMensaje(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info">
              {usuario.nombre} va a tener que elegir una contraseña nueva al ingresar. Se cierran sus sesiones abiertas
              y, si estaba bloqueado por intentos fallidos, se desbloquea.
            </Alert>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}
            <CampoPasswordTemporal
              valor={passwordTemporal}
              alCambiar={(valor) => {
                setPasswordTemporal(valor);
                setError(undefined);
              }}
              error={error}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            Restablecer
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
