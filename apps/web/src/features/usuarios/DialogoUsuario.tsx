'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  descripcionesDeRoles,
  erroresDeCampos,
  erroresDeCamposDeApi,
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  nombresDeRoles,
  ROLES,
  type DatosEditarUsuario,
  type ErroresDeCampos,
  type Rol,
  type Usuario,
} from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { CampoPasswordTemporal } from './CampoPasswordTemporal';

interface Props {
  /** Usuario a editar. Si no se pasa, el diálogo crea uno nuevo. */
  usuario?: Usuario;
  /** true si el administrador se está editando a sí mismo (no puede cambiar su rol ni desactivarse). */
  esUnoMismo?: boolean;
  alCerrar: () => void;
  alGuardar: (mensaje: string) => void;
}

export function DialogoUsuario({ usuario, esUnoMismo = false, alCerrar, alGuardar }: Props) {
  const editando = Boolean(usuario);

  const [valores, setValores] = useState({
    nombre: usuario?.nombre ?? '',
    usuario: usuario?.usuario ?? '',
    rol: (usuario?.rol ?? 'vendedor') as Rol,
    activo: usuario?.activo ?? true,
    passwordTemporal: '',
  });
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar<C extends keyof typeof valores>(campo: C, valor: (typeof valores)[C]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }

  async function guardarNuevo() {
    const validacion = esquemaCrearUsuario.safeParse(valores);
    if (!validacion.success) return setErrores(erroresDeCampos(validacion.error));

    const creado = await api.post<Usuario>('/usuarios', validacion.data);
    alGuardar(`Usuario "${creado.usuario}" creado. Pasale la contraseña temporal.`);
  }

  async function guardarCambios(original: Usuario) {
    // Solo se envía lo que cambió.
    const cambios: DatosEditarUsuario = {};
    if (valores.nombre !== original.nombre) cambios.nombre = valores.nombre;
    if (valores.rol !== original.rol) cambios.rol = valores.rol;
    if (valores.activo !== original.activo) cambios.activo = valores.activo;
    if (Object.keys(cambios).length === 0) return alCerrar();

    const validacion = esquemaEditarUsuario.safeParse(cambios);
    if (!validacion.success) return setErrores(erroresDeCampos(validacion.error));

    const actualizado = await api.patch<Usuario>(`/usuarios/${original.id}`, validacion.data);
    alGuardar(`Cambios guardados para "${actualizado.usuario}".`);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      if (usuario) await guardarCambios(usuario);
      else await guardarNuevo();
    } catch (error) {
      const deCampos = error instanceof ErrorDeApi ? erroresDeCamposDeApi(error.detalles) : {};
      if (Object.keys(deCampos).length > 0) setErrores(deCampos);
      else setMensaje(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}

            <TextField
              label="Nombre y apellido"
              fullWidth
              autoFocus
              value={valores.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              error={Boolean(errores.nombre)}
              helperText={errores.nombre}
            />

            <TextField
              label="Usuario para ingresar"
              fullWidth
              disabled={editando}
              autoComplete="off"
              value={valores.usuario}
              onChange={(e) => cambiar('usuario', e.target.value)}
              error={Boolean(errores.usuario)}
              helperText={errores.usuario ?? (editando ? 'El usuario no se puede cambiar.' : 'Por ejemplo: juan.perez')}
              slotProps={{ htmlInput: { autoCapitalize: 'none', spellCheck: false } }}
            />

            <TextField
              select
              label="Rol"
              fullWidth
              disabled={esUnoMismo}
              value={valores.rol}
              onChange={(e) => cambiar('rol', e.target.value as Rol)}
              error={Boolean(errores.rol)}
              helperText={errores.rol ?? (esUnoMismo ? 'No podés cambiar tu propio rol.' : descripcionesDeRoles[valores.rol])}
            >
              {ROLES.map((rol) => (
                <MenuItem key={rol} value={rol}>
                  {nombresDeRoles[rol]}
                </MenuItem>
              ))}
            </TextField>

            {!editando && (
              <CampoPasswordTemporal
                valor={valores.passwordTemporal}
                alCambiar={(valor) => cambiar('passwordTemporal', valor)}
                error={errores.passwordTemporal}
              />
            )}

            {editando && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={valores.activo}
                      disabled={esUnoMismo}
                      onChange={(e) => cambiar('activo', e.target.checked)}
                    />
                  }
                  label={valores.activo ? 'Activo' : 'Desactivado'}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {esUnoMismo
                    ? 'No podés desactivar tu propio usuario.'
                    : 'Un usuario desactivado no puede ingresar y se cierran sus sesiones abiertas.'}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            {editando ? 'Guardar' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
