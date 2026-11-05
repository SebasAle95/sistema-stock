import { negocio } from '@stock/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { ventaItems, ventas } from '../../db/schema';
import { entreFechas } from '../../utils/fechas';

interface Rango {
  desde: string;
  hasta: string;
}

const numero = (expresion: ReturnType<typeof sql>) => expresion.mapWith(Number);

/** Ventas válidas (no anuladas) dentro del rango de días, en hora del negocio. */
const ventasDelRango = (rango: Rango) => and(eq(ventas.anulada, false), ...entreFechas(ventas.creadoEn, rango));

/** Fecha y hora local del negocio para agrupar por día u hora. */
const fechaLocal = sql`(${ventas.creadoEn} at time zone ${negocio.zonaHoraria})`;

export const estadisticasRepository = {
  async totales(rango: Rango) {
    const donde = ventasDelRango(rango);
    const [[ventasTot], [items]] = await Promise.all([
      obtenerDb()
        .select({
          ventas: numero(sql`count(*)`),
          recaudacion: numero(sql`coalesce(sum(${ventas.total}), 0)`),
        })
        .from(ventas)
        .where(donde),
      obtenerDb()
        .select({
          ganancia: numero(
            sql`coalesce(sum(${ventaItems.subtotal} - ${ventaItems.costoUnitario} * ${ventaItems.cantidad}) filter (where ${ventaItems.costoUnitario} is not null), 0)`,
          ),
          recaudacionConCosto: numero(
            sql`coalesce(sum(${ventaItems.subtotal}) filter (where ${ventaItems.costoUnitario} is not null), 0)`,
          ),
          recaudacionSinCosto: numero(
            sql`coalesce(sum(${ventaItems.subtotal}) filter (where ${ventaItems.costoUnitario} is null), 0)`,
          ),
        })
        .from(ventaItems)
        .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
        .where(donde),
    ]);
    return {
      ventas: ventasTot?.ventas ?? 0,
      recaudacion: ventasTot?.recaudacion ?? 0,
      ganancia: items?.ganancia ?? 0,
      recaudacionConCosto: items?.recaudacionConCosto ?? 0,
      recaudacionSinCosto: items?.recaudacionSinCosto ?? 0,
    };
  },

  porDia(rango: Rango) {
    const dia = sql<string>`to_char(${fechaLocal}::date, 'YYYY-MM-DD')`;
    return obtenerDb()
      .select({ fecha: dia, ventas: numero(sql`count(*)`), recaudacion: numero(sql`sum(${ventas.total})`) })
      .from(ventas)
      .where(ventasDelRango(rango))
      // Por posición: la zona horaria va como parámetro y Postgres no reconoce
      // "$1" del SELECT y "$7" del GROUP BY como la misma expresión.
      .groupBy(sql`1`);
  },

  porHora(rango: Rango) {
    const hora = sql<number>`extract(hour from ${fechaLocal})::int`.mapWith(Number);
    return obtenerDb()
      .select({ hora, ventas: numero(sql`count(*)`), recaudacion: numero(sql`sum(${ventas.total})`) })
      .from(ventas)
      .where(ventasDelRango(rango))
      .groupBy(sql`1`);
  },

  topProductos(rango: Rango, limite = 10) {
    const unidades = numero(sql`sum(${ventaItems.cantidad})`);
    return obtenerDb()
      .select({
        productoId: ventaItems.productoId,
        nombre: sql<string>`max(${ventaItems.nombre})`,
        unidades,
        recaudacion: numero(sql`sum(${ventaItems.subtotal})`),
        // null si a alguna unidad le falta el costo: mejor no mostrar una ganancia a medias.
        ganancia: sql<number | null>`case when bool_and(${ventaItems.costoUnitario} is not null)
          then sum(${ventaItems.subtotal} - ${ventaItems.costoUnitario} * ${ventaItems.cantidad}) end`.mapWith(
          (v: string | null) => (v === null ? null : Number(v)),
        ),
      })
      .from(ventaItems)
      .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
      .where(ventasDelRango(rango))
      .groupBy(ventaItems.productoId)
      .orderBy(desc(sql`sum(${ventaItems.cantidad})`), desc(sql`sum(${ventaItems.subtotal})`))
      .limit(limite);
  },

  porMedioDePago(rango: Rango) {
    return obtenerDb()
      .select({
        medioPago: ventas.medioPago,
        ventas: numero(sql`count(*)`),
        recaudacion: numero(sql`sum(${ventas.total})`),
      })
      .from(ventas)
      .where(ventasDelRango(rango))
      .groupBy(ventas.medioPago)
      .orderBy(desc(sql`sum(${ventas.total})`));
  },
};
