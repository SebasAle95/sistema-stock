'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { erroresDeCampos, esquemaLogin, type ErroresDeCampos, type Usuario } from '@stock/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, mensajeDeError } from '@/lib/apiClient';
import { CampoPassword } from './CampoPassword';

/** Solo permite volver a rutas internas (evita redirecciones a otros sitios). */
function destinoSeguro(siguiente: string | null): string {
  if (!siguiente || !siguiente.startsWith('/') || siguiente.startsWith('//') || siguiente.startsWith('/\\')) {
    return '/';
  }
  return siguiente.startsWith('/login') ? '/' : siguiente;
}

export function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();

  const [valores, setValores] = useState({ usuario: '', password: '' });
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(() =>
    parametros.get('expirada') ? 'Tu sesión expiró. Volvé a ingresar.' : null,
  );
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof typeof valores, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);

    const validacion = esquemaLogin.safeParse(valores);
    if (!validacion.success) {
      setErrores(erroresDeCampos(validacion.error));
      return;
    }

    setEnviando(true);
    try {
      const usuario = await api.post<Usuario>('/auth/login', validacion.data);
      router.replace(usuario.debeCambiarPassword ? '/cambiar-password' : destinoSeguro(parametros.get('siguiente')));
    } catch (error) {
      setMensaje(mensajeDeError(error));
      setValores((actuales) => ({ ...actuales, password: '' }));
      setEnviando(false);
    }
  }

  return (
    <Stack component="form" noValidate spacing={2.5} onSubmit={enviar}>
      {mensaje && <Alert severity="error">{mensaje}</Alert>}

      <TextField
        label="Usuario"
        name="usuario"
        autoComplete="username"
        autoCapitalize="none"
        autoFocus
        fullWidth
        value={valores.usuario}
        onChange={(e) => cambiar('usuario', e.target.value)}
        error={Boolean(errores.usuario)}
        helperText={errores.usuario}
      />

      <CampoPassword
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        fullWidth
        value={valores.password}
        onChange={(e) => cambiar('password', e.target.value)}
        error={Boolean(errores.password)}
        helperText={errores.password}
      />

      <Button type="submit" variant="contained" size="large" fullWidth loading={enviando}>
        Ingresar
      </Button>

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        ¿No tenés usuario o te olvidaste la contraseña? Pedíselo al administrador.
      </Typography>
    </Stack>
  );
}
