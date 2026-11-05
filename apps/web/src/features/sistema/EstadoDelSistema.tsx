'use client';

import RefreshIcon from '@mui/icons-material/Refresh';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip, { type ChipProps } from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearFechaHora, type EstadoBaseDeDatos, type EstadoSistema } from '@stock/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { api, ErrorDeApi } from '@/lib/apiClient';

type Consulta =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; datos: EstadoSistema }
  | { tipo: 'error'; mensaje: string };

const chipBaseDeDatos: Record<EstadoBaseDeDatos, { label: string; color: ChipProps['color'] }> = {
  conectada: { label: 'Conectada', color: 'success' },
  sin_configurar: { label: 'Sin configurar', color: 'warning' },
  error: { label: 'Error de conexión', color: 'error' },
};

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
      <Typography sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
      {children}
    </Stack>
  );
}

/** Tarjeta que verifica que la web llega a la API y la API a la base de datos. */
export function EstadoDelSistema() {
  const [consulta, setConsulta] = useState<Consulta>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    api
      .get<EstadoSistema>('/health')
      .then((datos) => {
        if (!cancelado) setConsulta({ tipo: 'ok', datos });
      })
      .catch((error: unknown) => {
        const mensaje = error instanceof ErrorDeApi ? error.message : 'Error desconocido';
        if (!cancelado) setConsulta({ tipo: 'error', mensaje });
      });

    return () => {
      cancelado = true;
    };
  }, [intento]);

  function reintentar() {
    setConsulta({ tipo: 'cargando' });
    setIntento((n) => n + 1);
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title="Estado del sistema"
        subheader="Conexión entre la web, la API y la base de datos"
        action={
          <Tooltip title="Volver a consultar">
            <IconButton onClick={reintentar} aria-label="Volver a consultar">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent>
        {consulta.tipo === 'cargando' && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={20} />
            <Typography>Consultando…</Typography>
          </Stack>
        )}

        {consulta.tipo === 'error' && (
          <Stack spacing={1}>
            <Fila etiqueta="API">
              <Chip label="Sin conexión" color="error" size="small" />
            </Fila>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {consulta.mensaje}. ¿Está corriendo la API? (npm run dev)
            </Typography>
          </Stack>
        )}

        {consulta.tipo === 'ok' && (
          <Stack spacing={1}>
            <Fila etiqueta="API">
              <Chip label="Funcionando" color="success" size="small" />
            </Fila>
            <Fila etiqueta="Base de datos">
              <Chip size="small" {...chipBaseDeDatos[consulta.datos.baseDeDatos]} />
            </Fila>
            <Fila etiqueta="Versión">
              <Typography>
                {consulta.datos.version} · {consulta.datos.entorno}
              </Typography>
            </Fila>
            <Fila etiqueta="Hora del servidor">
              <Typography>{formatearFechaHora(consulta.datos.hora)}</Typography>
            </Fila>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
