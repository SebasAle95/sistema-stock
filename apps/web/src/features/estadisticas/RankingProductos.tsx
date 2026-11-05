'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearMoneda, formatearNumero, type Estadisticas } from '@stock/shared';

/** Barras horizontales ordenadas de mayor a menor, un solo color, valor en la punta. */
export function RankingProductos({ productos }: { productos: Estadisticas['topProductos'] }) {
  const maximo = Math.max(1, ...productos.map((p) => p.unidades));

  if (productos.length === 0) {
    return <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>Sin ventas en el período.</Typography>;
  }

  return (
    <Stack spacing={1.25} role="list" aria-label="Productos más vendidos">
      {productos.map((p, i) => {
        const detalle = `${formatearMoneda(p.recaudacion)} vendidos${p.ganancia !== null ? ` · ganancia ${formatearMoneda(p.ganancia)}` : ''}`;
        return (
          <Tooltip key={p.productoId} placement="top-start" title={detalle}>
            <Box
              role="listitem"
              tabIndex={0}
              aria-label={`${i + 1}. ${p.nombre}: ${p.unidades} unidades, ${detalle}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(120px, 34%) 1fr' },
                gap: { xs: 0.5, sm: 2 },
                alignItems: 'center',
                outline: 'none',
                borderRadius: 1,
                '&:hover .barra, &:focus-visible .barra': { filter: 'brightness(1.25)' },
                '&:focus-visible': { bgcolor: 'action.hover' },
              }}
            >
              <Typography noWrap title={p.nombre}>
                <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </Box>
                {p.nombre}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Box
                  className="barra"
                  sx={{
                    height: 16,
                    width: `${(p.unidades / maximo) * 80}%`,
                    minWidth: 2,
                    bgcolor: 'primary.main',
                    borderRadius: '0 4px 4px 0',
                    transition: 'width 200ms ease, filter 120ms ease',
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatearNumero(p.unidades)} u.
                </Typography>
              </Stack>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
