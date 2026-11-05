'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearMoneda, formatearPorcentaje, negocio, nombreMedioDePago, type Estadisticas } from '@stock/shared';

/**
 * Colores por medio de pago (paleta categórica validada para daltonismo, claro y oscuro).
 * El color sigue al medio de pago según su lugar en la configuración, nunca según
 * cuánto se vendió: efectivo siempre es azul aunque un día venda menos.
 */
const CLAROS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const OSCUROS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];

const variable = (medio: string) => `--medio-${Math.max(0, negocio.mediosDePago.findIndex((m) => m.id === medio))}`;

export function MediosDePago({ medios }: { medios: Estadisticas['porMedioDePago'] }) {
  const total = medios.reduce((s, m) => s + m.recaudacion, 0);
  const ordenados = [...medios].sort(
    (a, b) =>
      negocio.mediosDePago.findIndex((m) => m.id === a.medioPago) - negocio.mediosDePago.findIndex((m) => m.id === b.medioPago),
  );

  if (total === 0) {
    return <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>Sin ventas en el período.</Typography>;
  }

  return (
    <Box
      sx={(theme) => ({
        ...Object.fromEntries(CLAROS.map((c, i) => [`--medio-${i}`, c])),
        ...theme.applyStyles('dark', Object.fromEntries(OSCUROS.map((c, i) => [`--medio-${i}`, c]))),
      })}
    >
      {/* Barra fina segmentada, sin texto: los montos están en la lista de abajo. */}
      <Box
        role="img"
        aria-label={ordenados.map((m) => `${nombreMedioDePago(m.medioPago)} ${formatearPorcentaje(m.recaudacion / total)}`).join(', ')}
        sx={{ display: 'flex', gap: '2px', height: 8, mb: 2.5 }}
      >
        {ordenados.map((m) => (
          <Tooltip key={m.medioPago} title={`${nombreMedioDePago(m.medioPago)}: ${formatearMoneda(m.recaudacion)}`}>
            <Box
              sx={{
                flex: m.recaudacion,
                bgcolor: `var(${variable(m.medioPago)})`,
                borderRadius: 999,
                '&:hover': { filter: 'brightness(1.15)' },
              }}
            />
          </Tooltip>
        ))}
      </Box>

      <Stack spacing={1.25}>
        {ordenados.map((m) => (
          <Stack key={m.medioPago} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 0.75, bgcolor: `var(${variable(m.medioPago)})`, flexShrink: 0 }} />
            <Typography sx={{ flex: 1 }}>
              {nombreMedioDePago(m.medioPago)}
              <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                {m.ventas} {m.ventas === 1 ? 'venta' : 'ventas'}
              </Typography>
            </Typography>
            <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatearMoneda(m.recaudacion)}</Typography>
            <Typography sx={{ color: 'text.secondary', width: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatearPorcentaje(m.recaudacion / total)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
