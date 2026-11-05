import {
  diasEntre,
  fechasDelRango,
  sumarDias,
  type Estadisticas,
  type FiltrosEstadisticas,
  type TotalesPeriodo,
} from '@stock/shared';
import { redondear } from '../../utils/fechas';
import { estadisticasRepository } from './estadisticas.repository';

async function totalesDe(rango: { desde: string; hasta: string }): Promise<TotalesPeriodo> {
  const t = await estadisticasRepository.totales(rango);
  return {
    recaudacion: t.recaudacion,
    ventas: t.ventas,
    ticketPromedio: t.ventas > 0 ? redondear(t.recaudacion / t.ventas) : 0,
    ganancia: redondear(t.ganancia),
    margen: t.recaudacionConCosto > 0 ? t.ganancia / t.recaudacionConCosto : 0,
    recaudacionSinCosto: t.recaudacionSinCosto,
  };
}

export const estadisticasService = {
  async obtener({ desde, hasta }: FiltrosEstadisticas): Promise<Estadisticas> {
    const dias = diasEntre(desde, hasta);
    // Período anterior de la misma duración, justo antes (ej: estos 7 días vs los 7 anteriores).
    const anterior = { desde: sumarDias(desde, -dias), hasta: sumarDias(desde, -1) };
    const rango = { desde, hasta };

    const [actualTot, anteriorTot, porDia, porHora, topProductos, porMedioDePago] = await Promise.all([
      totalesDe(rango),
      totalesDe(anterior),
      estadisticasRepository.porDia(rango),
      estadisticasRepository.porHora(rango),
      estadisticasRepository.topProductos(rango),
      estadisticasRepository.porMedioDePago(rango),
    ]);

    // Se completan los días y horas sin ventas con 0, para que el gráfico no tenga huecos.
    const diaMap = new Map(porDia.map((d) => [d.fecha, d]));
    const horaMap = new Map(porHora.map((h) => [h.hora, h]));

    return {
      desde,
      hasta,
      dias,
      actual: actualTot,
      anterior: anteriorTot,
      porDia: fechasDelRango(desde, hasta).map((fecha) => ({
        fecha,
        ventas: diaMap.get(fecha)?.ventas ?? 0,
        recaudacion: diaMap.get(fecha)?.recaudacion ?? 0,
      })),
      porHora: Array.from({ length: 24 }, (_, hora) => ({
        hora,
        ventas: horaMap.get(hora)?.ventas ?? 0,
        recaudacion: horaMap.get(hora)?.recaudacion ?? 0,
      })),
      topProductos: topProductos.map((p) => ({ ...p, ganancia: p.ganancia === null ? null : redondear(p.ganancia) })),
      porMedioDePago,
    };
  },
};
