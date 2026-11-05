'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  formatearMoneda,
  formatearNumero,
  formatearPorcentaje,
  hoyEnNegocio,
  inicioDeMes,
  negocio,
  nombreMedioDePago,
  sumarDias,
  type Estadisticas,
} from '@stock/shared';
import { useState } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useConsulta } from '@/hooks/useConsulta';
import { GraficoColumnas, type Columna } from './GraficoColumnas';
import { MediosDePago } from './MediosDePago';
import { RankingProductos } from './RankingProductos';
import { TarjetaGrafico } from './TarjetaGrafico';
import { TarjetaIndicador } from './TarjetaIndicador';

type Preset = 'hoy' | '7' | '30' | 'mes' | 'personalizado';

function rangoDe(preset: Exclude<Preset, 'personalizado'>): { desde: string; hasta: string } {
  const hoy = hoyEnNegocio();
  if (preset === 'hoy') return { desde: hoy, hasta: hoy };
  if (preset === 'mes') return { desde: inicioDeMes(hoy), hasta: hoy };
  return { desde: sumarDias(hoy, -(Number(preset) - 1)), hasta: hoy };
}

// Las fechas "AAAA-MM-DD" son días de calendario: se formatean en UTC para no correrse un día.
const diaCorto = new Intl.DateTimeFormat(negocio.locale, { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
const diaLargo = new Intl.DateTimeFormat(negocio.locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
const aFecha = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const ventasTexto = (n: number) => `${formatearNumero(n)} ${n === 1 ? 'venta' : 'ventas'}`;

export function PantallaEstadisticas() {
  const [preset, setPreset] = useState<Preset>('7');
  const [personalizado, setPersonalizado] = useState(() => rangoDe('7'));
  const rango = preset === 'personalizado' ? personalizado : rangoDe(preset);
  const rangoValido = Boolean(rango.desde && rango.hasta && rango.desde <= rango.hasta);

  const consulta = useConsulta<Estadisticas>(
    rangoValido ? `/estadisticas?${new URLSearchParams(rango)}` : null,
  );
  const e = consulta.datos;

  const unSoloDia = e?.dias === 1;
  const columnasTiempo: Columna[] = !e
    ? []
    : unSoloDia
      ? e.porHora
          .filter((h) => h.hora >= 8 || h.ventas > 0)
          .map((h) => ({ clave: String(h.hora), etiqueta: `${h.hora} h`, etiquetaLarga: `De ${h.hora} a ${h.hora + 1} h`, valor: h.recaudacion, detalle: ventasTexto(h.ventas) }))
      : e.porDia.map((d) => ({
          clave: d.fecha,
          // Dos renglones ("vie" / "30") para que entren en pantallas chicas.
          etiqueta: diaCorto.format(aFecha(d.fecha)).replace(' ', '\n'),
          etiquetaLarga: diaLargo.format(aFecha(d.fecha)),
          valor: d.recaudacion,
          detalle: ventasTexto(d.ventas),
        }));
  const columnasHora: Columna[] = (e?.porHora ?? []).map((h) => ({
    clave: String(h.hora),
    etiqueta: `${h.hora} h`,
    etiquetaLarga: `De ${h.hora} a ${h.hora + 1} h`,
    valor: h.ventas,
    detalle: formatearMoneda(h.recaudacion),
  }));
  const horaPico = e && e.actual.ventas > 0 ? e.porHora.reduce((a, b) => (b.ventas > a.ventas ? b : a)) : null;

  return (
    <Stack spacing={3}>
      <EncabezadoPagina titulo="Estadísticas" descripcion="Cuánto se vende, cuánto se gana, qué sale más y a qué hora." />

      {/* Filtros: una sola fila, arriba de todo; afectan a todos los números de abajo. */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={preset}
          onChange={(_, v: Preset | null) => v && setPreset(v)}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="hoy">Hoy</ToggleButton>
          <ToggleButton value="7">7 días</ToggleButton>
          <ToggleButton value="30">30 días</ToggleButton>
          <ToggleButton value="mes">Este mes</ToggleButton>
          <ToggleButton value="personalizado">Elegir fechas</ToggleButton>
        </ToggleButtonGroup>
        {preset === 'personalizado' && (
          <Stack direction="row" spacing={1.5}>
            <TextField
              type="date"
              size="small"
              label="Desde"
              value={personalizado.desde}
              onChange={(ev) => setPersonalizado((r) => ({ ...r, desde: ev.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              size="small"
              label="Hasta"
              value={personalizado.hasta}
              onChange={(ev) => setPersonalizado((r) => ({ ...r, hasta: ev.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        )}
        {consulta.cargando && e && <CircularProgress size={20} aria-label="Actualizando" />}
      </Stack>

      {!rangoValido && <Alert severity="warning">Elegí un rango de fechas válido.</Alert>}
      {consulta.error && <Alert severity="error">{consulta.error}</Alert>}
      {!e && rangoValido && !consulta.error && <CircularProgress aria-label="Cargando estadísticas" />}

      {e && (
        // Mientras recarga, se mantiene lo anterior atenuado (sin saltos ni parpadeos).
        <Stack spacing={3} sx={{ opacity: consulta.cargando ? 0.55 : 1, transition: 'opacity 150ms' }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1.4fr 1fr 1fr 1fr' } }}>
            <TarjetaIndicador
              principal
              etiqueta="Recaudación"
              valor={formatearMoneda(e.actual.recaudacion)}
              actual={e.actual.recaudacion}
              anterior={e.anterior.recaudacion}
            />
            <TarjetaIndicador
              etiqueta="Ganancia"
              valor={formatearMoneda(e.actual.ganancia)}
              actual={e.actual.ganancia}
              anterior={e.anterior.ganancia}
              nota={
                e.actual.recaudacionSinCosto > 0
                  ? `Margen ${formatearPorcentaje(e.actual.margen)}. No incluye ${formatearMoneda(e.actual.recaudacionSinCosto)} de productos sin costo cargado.`
                  : `Margen ${formatearPorcentaje(e.actual.margen)} sobre lo vendido.`
              }
            />
            <TarjetaIndicador
              etiqueta="Ventas"
              valor={formatearNumero(e.actual.ventas)}
              actual={e.actual.ventas}
              anterior={e.anterior.ventas}
            />
            <TarjetaIndicador
              etiqueta="Ticket promedio"
              valor={formatearMoneda(Math.round(e.actual.ticketPromedio))}
              actual={e.actual.ticketPromedio}
              anterior={e.anterior.ticketPromedio}
            />
          </Box>

          <TarjetaGrafico
            titulo={unSoloDia ? 'Recaudación por hora' : 'Recaudación por día'}
            subtitulo={unSoloDia ? 'Lo cobrado en cada hora del día.' : 'Lo cobrado cada día del período.'}
            tabla={{
              columnas: [unSoloDia ? 'Hora' : 'Día', 'Ventas', 'Recaudación'],
              filas: unSoloDia
                ? e.porHora.map((h) => [`${h.hora} a ${h.hora + 1} h`, formatearNumero(h.ventas), formatearMoneda(h.recaudacion)])
                : e.porDia.map((d) => [diaLargo.format(aFecha(d.fecha)), formatearNumero(d.ventas), formatearMoneda(d.recaudacion)]),
              numericas: [1, 2],
            }}
          >
            <GraficoColumnas
              columnas={columnasTiempo}
              formato={formatearMoneda}
              etiquetaCada={columnasTiempo.length > 16 ? Math.ceil(columnasTiempo.length / 10) : 1}
              descripcion={unSoloDia ? 'Recaudación por hora' : 'Recaudación por día'}
            />
          </TarjetaGrafico>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, alignItems: 'start' }}>
            <TarjetaGrafico
              titulo="Horarios pico"
              subtitulo={
                horaPico
                  ? `La hora con más ventas es de ${horaPico.hora} a ${horaPico.hora + 1} h.`
                  : 'Cantidad de ventas según la hora del día.'
              }
              tabla={{
                columnas: ['Hora', 'Ventas', 'Recaudación'],
                filas: e.porHora.map((h) => [`${h.hora} a ${h.hora + 1} h`, formatearNumero(h.ventas), formatearMoneda(h.recaudacion)]),
                numericas: [1, 2],
              }}
            >
              <GraficoColumnas
                columnas={columnasHora}
                formato={(v) => ventasTexto(v)}
                destacarMaximo
                etiquetaCada={3}
                alto={200}
                descripcion="Ventas por hora del día"
              />
            </TarjetaGrafico>

            <TarjetaGrafico
              titulo="Medios de pago"
              subtitulo="Cómo pagaron los clientes."
              tabla={{
                columnas: ['Medio de pago', 'Ventas', 'Recaudación'],
                filas: e.porMedioDePago.map((m) => [nombreMedioDePago(m.medioPago), formatearNumero(m.ventas), formatearMoneda(m.recaudacion)]),
                numericas: [1, 2],
              }}
            >
              <MediosDePago medios={e.porMedioDePago} />
            </TarjetaGrafico>
          </Box>

          <TarjetaGrafico
            titulo="Productos más vendidos"
            subtitulo="Los 10 con más unidades vendidas en el período."
            tabla={{
              columnas: ['Producto', 'Unidades', 'Recaudación', 'Ganancia'],
              filas: e.topProductos.map((p) => [
                p.nombre,
                formatearNumero(p.unidades),
                formatearMoneda(p.recaudacion),
                p.ganancia !== null ? formatearMoneda(p.ganancia) : 'Sin costo',
              ]),
              numericas: [1, 2, 3],
            }}
          >
            <RankingProductos productos={e.topProductos} />
          </TarjetaGrafico>

          {e.actual.ventas === 0 && (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>No hubo ventas en este período.</Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
