import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatearPorcentaje } from '@stock/shared';
import type { ReactNode } from 'react';

interface Props {
  etiqueta: string;
  valor: string;
  /** Valores para calcular la variación contra el período anterior. */
  actual: number;
  anterior: number;
  /** La cifra principal del tablero (más grande). Una sola por pantalla. */
  principal?: boolean;
  nota?: ReactNode;
}

/** Variación con flecha y texto (nunca solo color). Para estos indicadores, subir es bueno. */
function Variacion({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {actual > 0 ? 'Sin datos del período anterior' : 'Sin cambios'}
      </Typography>
    );
  }
  const cambio = (actual - anterior) / anterior;
  const sube = cambio > 0;
  const igual = Math.abs(cambio) < 0.005;
  const color = igual ? 'text.secondary' : sube ? 'success.main' : 'error.main';
  const Icono = sube ? ArrowUpwardIcon : ArrowDownwardIcon;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {!igual && <Icono sx={{ fontSize: 16, color }} />}
      <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
        {igual ? 'Igual' : `${sube ? '+' : '−'}${formatearPorcentaje(Math.abs(cambio))}`}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        vs. período anterior
      </Typography>
    </Stack>
  );
}

export function TarjetaIndicador({ etiqueta, valor, actual, anterior, principal = false, nota }: Props) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{etiqueta}</Typography>
        <Typography
          component="p"
          sx={{ fontWeight: 700, fontSize: principal ? { xs: '2.5rem', md: '3rem' } : '1.9rem', lineHeight: 1.15, my: 0.75 }}
        >
          {valor}
        </Typography>
        <Variacion actual={actual} anterior={anterior} />
        {nota && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {nota}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
