'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {
  erroresDeCampos,
  erroresDeCamposDeApi,
  esquemaCambiarPassword,
  type ErroresDeCampos,
  type Usuario,
} from '@stock/shared';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { CampoPassword } from './CampoPassword';
import { useSesion } from './SesionProvider';

const valoresIniciales = { passwordActual: '', passwordNueva: '', confirmacion: '' };

export function FormularioCambiarPassword() {
  const router = useRouter();
  const { usuario, actualizarUsuario, cerrarSesion } = useSesion();
  const obligatorio = usuario.debeCambiarPassword;

  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof typeof valoresIniciales, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);

    const validacion = esquemaCambiarPassword.safeParse(valores);
    if (!validacion.success) {
      setErrores(erroresDeCampos(validacion.error));
      return;
    }

    setEnviando(true);
    try {
      const actualizado = await api.post<Usuario>('/auth/cambiar-password', validacion.data);
      actualizarUsuario(actualizado);
      router.replace('/');
    } catch (error) {
      const deCampos = error instanceof ErrorDeApi ? erroresDeCamposDeApi(error.detalles) : {};
      if (Object.keys(deCampos).length > 0) setErrores(deCampos);
      else setMensaje(mensajeDeError(error));
      setEnviando(false);
    }
  }

  return (
    <Stack component="form" noValidate spacing={2.5} onSubmit={enviar}>
      {obligatorio && (
        <Alert severity="info">
          Hola {usuario.nombre}. Tu contraseña es temporal: elegí una nueva que solo sepas vos.
        </Alert>
      )}
      {mensaje && <Alert severity="error">{mensaje}</Alert>}

      <CampoPassword
        label={obligatorio ? 'Contraseña temporal' : 'Contraseña actual'}
        autoComplete="current-password"
        autoFocus
        fullWidth
        value={valores.passwordActual}
        onChange={(e) => cambiar('passwordActual', e.target.value)}
        error={Boolean(errores.passwordActual)}
        helperText={errores.passwordActual}
      />
      <CampoPassword
        label="Contraseña nueva"
        autoComplete="new-password"
        fullWidth
        value={valores.passwordNueva}
        onChange={(e) => cambiar('passwordNueva', e.target.value)}
        error={Boolean(errores.passwordNueva)}
        helperText={errores.passwordNueva ?? 'Mínimo 8 caracteres, con al menos una letra y un número.'}
      />
      <CampoPassword
        label="Repetí la contraseña nueva"
        autoComplete="new-password"
        fullWidth
        value={valores.confirmacion}
        onChange={(e) => cambiar('confirmacion', e.target.value)}
        error={Boolean(errores.confirmacion)}
        helperText={errores.confirmacion}
      />

      <Button type="submit" variant="contained" size="large" fullWidth loading={enviando}>
        Guardar contraseña
      </Button>

      {obligatorio ? (
        <Button color="inherit" onClick={() => void cerrarSesion()}>
          Salir
        </Button>
      ) : (
        <Button color="inherit" onClick={() => router.back()}>
          Cancelar
        </Button>
      )}
    </Stack>
  );
}
