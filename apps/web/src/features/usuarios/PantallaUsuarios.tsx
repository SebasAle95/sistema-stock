'use client';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearFechaHora, nombresDeRoles, type Usuario } from '@stock/shared';
import { useEffect, useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useSesion } from '@/features/auth/SesionProvider';
import { api, mensajeDeError } from '@/lib/apiClient';
import { DialogoRestablecerPassword } from './DialogoRestablecerPassword';
import { DialogoUsuario } from './DialogoUsuario';

type Consulta = { tipo: 'cargando' } | { tipo: 'ok'; usuarios: Usuario[] } | { tipo: 'error'; mensaje: string };

type DialogoAbierto =
  | { tipo: 'crear' }
  | { tipo: 'editar'; usuario: Usuario }
  | { tipo: 'restablecer'; usuario: Usuario }
  | null;

function ChipsDeEstado({ usuario }: { usuario: Usuario }) {
  return (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {usuario.activo ? (
        <Chip size="small" color="success" variant="outlined" label="Activo" />
      ) : (
        <Chip size="small" label="Desactivado" />
      )}
      {usuario.activo && usuario.debeCambiarPassword && (
        <Chip size="small" color="warning" variant="outlined" label="Contraseña temporal" />
      )}
    </Stack>
  );
}

export function PantallaUsuarios() {
  const { usuario: yo } = useSesion();
  const [consulta, setConsulta] = useState<Consulta>({ tipo: 'cargando' });
  const [recarga, setRecarga] = useState(0);
  const [dialogo, setDialogo] = useState<DialogoAbierto>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<Usuario[]>('/usuarios')
      .then((usuarios) => !cancelado && setConsulta({ tipo: 'ok', usuarios }))
      .catch((error: unknown) => !cancelado && setConsulta({ tipo: 'error', mensaje: mensajeDeError(error) }));
    return () => {
      cancelado = true;
    };
  }, [recarga]);

  function alGuardar(mensaje: string) {
    setDialogo(null);
    setAviso(mensaje);
    setRecarga((n) => n + 1);
  }

  return (
    <Stack spacing={3}>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Quién puede ingresar al sistema y qué puede hacer cada uno."
        accion={
          <Button variant="contained" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={() => setDialogo({ tipo: 'crear' })}>
            Nuevo usuario
          </Button>
        }
      />

      {consulta.tipo === 'error' && <Alert severity="error">{consulta.mensaje}</Alert>}

      <Card variant="outlined">
        {consulta.tipo === 'cargando' ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress aria-label="Cargando usuarios" />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último ingreso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consulta.tipo === 'ok' &&
                  consulta.usuarios.map((usuario) => {
                    const esUnoMismo = usuario.id === yo.id;
                    return (
                      <TableRow key={usuario.id} hover sx={{ opacity: usuario.activo ? 1 : 0.6 }}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {usuario.nombre}
                          {esUnoMismo && (
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.75 }}>
                              (vos)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{usuario.usuario}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={nombresDeRoles[usuario.rol]}
                            color={usuario.rol === 'administrador' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <ChipsDeEstado usuario={usuario} />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {usuario.ultimoAcceso ? formatearFechaHora(usuario.ultimoAcceso) : 'Nunca'}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Editar">
                            <IconButton aria-label={`Editar a ${usuario.nombre}`} onClick={() => setDialogo({ tipo: 'editar', usuario })}>
                              <EditOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                          {!esUnoMismo && (
                            <Tooltip title="Restablecer contraseña">
                              <IconButton
                                aria-label={`Restablecer la contraseña de ${usuario.nombre}`}
                                onClick={() => setDialogo({ tipo: 'restablecer', usuario })}
                              >
                                <LockResetOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {dialogo?.tipo === 'crear' && <DialogoUsuario alCerrar={() => setDialogo(null)} alGuardar={alGuardar} />}
      {dialogo?.tipo === 'editar' && (
        <DialogoUsuario
          usuario={dialogo.usuario}
          esUnoMismo={dialogo.usuario.id === yo.id}
          alCerrar={() => setDialogo(null)}
          alGuardar={alGuardar}
        />
      )}
      {dialogo?.tipo === 'restablecer' && (
        <DialogoRestablecerPassword usuario={dialogo.usuario} alCerrar={() => setDialogo(null)} alGuardar={alGuardar} />
      )}

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={8000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
