'use client';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { negocio } from '@stock/shared';

export interface Columna {
  clave: string;
  /** Etiqueta corta para el eje (ej: "19 h"). Con "\n" se parte en dos renglones ("lun\n3"). */
  etiqueta: string;
  /** Etiqueta completa para la ayuda emergente (ej: "lunes 3 de noviembre"). */
  etiquetaLarga?: string;
  valor: number;
  /** Dato secundario para la ayuda emergente (ej: "12 ventas"). */
  detalle?: string;
}

interface Props {
  columnas: Columna[];
  formato: (valor: number) => string;
  /** Resalta la columna más alta (el resto en gris): para "horarios pico". */
  destacarMaximo?: boolean;
  /** Mostrar la etiqueta del eje cada N columnas (para que no se pisen). */
  etiquetaCada?: number;
  alto?: number;
  /** Nombre del gráfico para lectores de pantalla. */
  descripcion: string;
}

const ANCHO_EJE = 64;

/** Máximo "redondo" del eje y sus marcas: 0, 25.000, 50.000, 75.000, 100.000. */
function escala(maximo: number, marcas = 4) {
  if (maximo <= 0) return { tope: 1, pasos: [0] };
  const bruto = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = ([1, 2, 2.5, 5, 10].find((m) => m * potencia >= bruto) ?? 10) * potencia;
  const tope = paso * Math.ceil(maximo / paso);
  return { tope, pasos: Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso) };
}

const compacto = new Intl.NumberFormat(negocio.locale, { notation: 'compact', maximumFractionDigits: 1 });
const completo = new Intl.NumberFormat(negocio.locale);

/** Marcas del eje: completas por debajo de 10.000, compactas si el eje llega a 10.000 ("10 mil"). */
function formatoEje(tope: number) {
  return (v: number) => (tope >= 10_000 ? compacto.format(v) : completo.format(v));
}

/**
 * Gráfico de columnas en HTML: una sola serie, un solo color. Cada columna tiene
 * ayuda emergente al pasar el mouse o con el teclado, y el área sensible es toda
 * la franja (más grande que la barra).
 */
export function GraficoColumnas({ columnas, formato, destacarMaximo = false, etiquetaCada = 1, alto = 220, descripcion }: Props) {
  const maximo = Math.max(0, ...columnas.map((c) => c.valor));
  const { tope, pasos } = escala(maximo);
  const indiceMaximo = maximo > 0 ? columnas.findIndex((c) => c.valor === maximo) : -1;
  const eje = formatoEje(tope);

  return (
    <Box role="group" aria-label={descripcion}>
      <Box sx={{ display: 'flex' }}>
        {/* Eje Y */}
        <Box sx={{ width: ANCHO_EJE, position: 'relative', height: alto, flexShrink: 0 }} aria-hidden>
          {pasos.map((p) => (
            <Typography
              key={p}
              variant="caption"
              sx={{
                position: 'absolute',
                right: 8,
                bottom: `calc(${(p / tope) * 100}% - 8px)`,
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {eje(p)}
            </Typography>
          ))}
        </Box>

        {/* Área del gráfico */}
        <Box sx={{ position: 'relative', flex: 1, height: alto, minWidth: 0 }}>
          {pasos.map((p) => (
            <Box
              key={p}
              aria-hidden
              sx={{ position: 'absolute', left: 0, right: 0, bottom: `${(p / tope) * 100}%`, borderTop: 1, borderColor: 'divider' }}
            />
          ))}
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch' }}>
            {columnas.map((c, i) => {
              const esMaximo = i === indiceMaximo;
              const color = destacarMaximo && !esMaximo ? 'action.disabled' : 'primary.main';
              return (
                <Tooltip
                  key={c.clave}
                  placement="top"
                  title={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{formato(c.valor)}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                        {c.etiquetaLarga ?? c.etiqueta}
                        {c.detalle ? ` · ${c.detalle}` : ''}
                      </Typography>
                    </Box>
                  }
                >
                  <Box
                    tabIndex={0}
                    aria-label={`${c.etiquetaLarga ?? c.etiqueta}: ${formato(c.valor)}${c.detalle ? `, ${c.detalle}` : ''}`}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      position: 'relative',
                      outline: 'none',
                      '&:hover .barra, &:focus-visible .barra': { filter: 'brightness(1.25)' },
                      '&:focus-visible': { bgcolor: 'action.hover', borderRadius: 1 },
                    }}
                  >
                    {/* Una sola etiqueta directa: el valor más alto. */}
                    {esMaximo && (
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, whiteSpace: 'nowrap', lineHeight: 1 }}
                      >
                        {formato(c.valor)}
                      </Typography>
                    )}
                    <Box
                      className="barra"
                      sx={{
                        width: 'min(24px, 70%)',
                        height: `${(c.valor / tope) * 100}%`,
                        minHeight: c.valor > 0 ? 2 : 0,
                        bgcolor: color,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 200ms ease, filter 120ms ease',
                      }}
                    />
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Eje X */}
      <Box sx={{ display: 'flex', pl: `${ANCHO_EJE}px`, mt: 0.75 }} aria-hidden>
        {columnas.map((c, i) => (
          <Typography
            key={c.clave}
            variant="caption"
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              color: 'text.secondary',
              whiteSpace: 'pre-line',
              lineHeight: 1.3,
              overflow: 'visible',
            }}
          >
            {i % etiquetaCada === 0 ? c.etiqueta : ''}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
