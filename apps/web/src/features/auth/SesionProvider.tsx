'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { tienePermiso, type Permiso, type Usuario } from '@stock/shared';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';

interface ContextoSesion {
  usuario: Usuario;
  tienePermiso: (permiso: Permiso) => boolean;
  actualizarUsuario: (usuario: Usuario) => void;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; usuario: Usuario } | { tipo: 'error'; mensaje: string };

function PantallaCompleta({ children }: { children: ReactNode }) {
  return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>{children}</Box>;
}

interface Props {
  children: ReactNode;
  /** Solo para la pantalla de cambio de contraseña: no redirige aunque esté pendiente. */
  permitirPasswordPendiente?: boolean;
}

/**
 * Consulta la sesión a la API y la comparte con toda la app (`useSesion`).
 * Si no hay sesión, lleva al login; si hay que cambiar la contraseña, a esa pantalla.
 */
export function SesionProvider({ children, permitirPasswordPendiente = false }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    api
      .get<Usuario>('/auth/sesion')
      .then((usuario) => {
        if (cancelado) return;
        if (usuario.debeCambiarPassword && !permitirPasswordPendiente) {
          router.replace('/cambiar-password');
          return;
        }
        setEstado({ tipo: 'ok', usuario });
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        if (error instanceof ErrorDeApi && error.status === 401) {
          router.replace(`/login?siguiente=${encodeURIComponent(ruta)}`);
          return;
        }
        setEstado({ tipo: 'error', mensaje: mensajeDeError(error) });
      });

    return () => {
      cancelado = true;
    };
    // La sesión se consulta al entrar (y al reintentar), no en cada cambio de pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  const cerrarSesion = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    // Recarga completa a propósito (no router.push): no queda ningún dato del usuario en memoria.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login');
  }, []);

  const valor = useMemo<ContextoSesion | null>(() => {
    if (estado.tipo !== 'ok') return null;
    return {
      usuario: estado.usuario,
      tienePermiso: (permiso) => tienePermiso(estado.usuario.rol, permiso),
      actualizarUsuario: (usuario) => setEstado({ tipo: 'ok', usuario }),
      cerrarSesion,
    };
  }, [estado, cerrarSesion]);

  if (estado.tipo === 'error') {
    return (
      <PantallaCompleta>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setEstado({ tipo: 'cargando' });
                setIntento((n) => n + 1);
              }}
            >
              Reintentar
            </Button>
          }
        >
          {estado.mensaje}
        </Alert>
      </PantallaCompleta>
    );
  }

  if (!valor) {
    return (
      <PantallaCompleta>
        <CircularProgress aria-label="Cargando" />
      </PantallaCompleta>
    );
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Usuario logueado y utilidades de sesión. Solo dentro de `SesionProvider`. */
export function useSesion(): ContextoSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion se usó fuera de <SesionProvider>');
  return contexto;
}
