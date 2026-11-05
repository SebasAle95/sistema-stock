import type { FiltrosCajas, TipoMovimientoCaja } from '@stock/shared';
import { MEDIO_EFECTIVO } from '@stock/shared';
import { and, asc, desc, eq, getTableColumns, isNotNull, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { obtenerDb, type BaseDeDatos } from '../../db/client';
import { cajas, movimientosCaja, usuarios, ventas } from '../../db/schema';
import { entreFechas, redondear } from '../../utils/fechas';

/** Cliente de base o transacción: las consultas sirven para los dos. */
type Ejecutor = Pick<BaseDeDatos, 'select'>;

const abridor = alias(usuarios, 'abridor');
const cerrador = alias(usuarios, 'cerrador');

/** Ventas no anuladas de la caja. */
const cantidadVentas = sql<number>`(select count(*) from ${ventas} where ${ventas.cajaId} = ${cajas.id} and not ${ventas.anulada})`.mapWith(Number);

function consultaCajas(ejecutor: Ejecutor) {
  return ejecutor
    .select({
      ...getTableColumns(cajas),
      abiertaPorNombre: abridor.nombre,
      cerradaPorNombre: cerrador.nombre,
      cantidadVentas,
    })
    .from(cajas)
    .innerJoin(abridor, eq(cajas.abiertaPor, abridor.id))
    .leftJoin(cerrador, eq(cajas.cerradaPor, cerrador.id));
}

export type FilaCajaCompleta = Awaited<ReturnType<ReturnType<typeof consultaCajas>['where']>>[number];

export const cajaRepository = {
  async buscarAbierta(ejecutor: Ejecutor = obtenerDb()): Promise<FilaCajaCompleta | undefined> {
    const [fila] = await consultaCajas(ejecutor).where(isNull(cajas.cerradaEn)).limit(1);
    return fila;
  },

  async buscarPorId(id: string): Promise<FilaCajaCompleta | undefined> {
    const [fila] = await consultaCajas(obtenerDb()).where(eq(cajas.id, id)).limit(1);
    return fila;
  },

  async abrir(usuarioId: string, montoInicial: number): Promise<string> {
    const [fila] = await obtenerDb()
      .insert(cajas)
      .values({ abiertaPor: usuarioId, montoInicial })
      .returning({ id: cajas.id });
    if (!fila) throw new Error('No se pudo abrir la caja');
    return fila.id;
  },

  /** Totales de la caja: ventas por medio de pago, ingresos, egresos y efectivo esperado. */
  async resumen(caja: { id: string; montoInicial: number }, ejecutor: Ejecutor = obtenerDb()) {
    const [porMedio, porTipo] = await Promise.all([
      ejecutor
        .select({
          medioPago: ventas.medioPago,
          cantidad: sql<number>`count(*)`.mapWith(Number),
          total: sql<number>`coalesce(sum(${ventas.total}), 0)`.mapWith(Number),
        })
        .from(ventas)
        .where(and(eq(ventas.cajaId, caja.id), eq(ventas.anulada, false)))
        .groupBy(ventas.medioPago)
        .orderBy(asc(ventas.medioPago)),
      ejecutor
        .select({
          tipo: movimientosCaja.tipo,
          total: sql<number>`coalesce(sum(${movimientosCaja.monto}), 0)`.mapWith(Number),
        })
        .from(movimientosCaja)
        .where(eq(movimientosCaja.cajaId, caja.id))
        .groupBy(movimientosCaja.tipo),
    ]);

    const ingresos = porTipo.find((t) => t.tipo === 'ingreso')?.total ?? 0;
    const egresos = porTipo.find((t) => t.tipo === 'egreso')?.total ?? 0;
    const ventasEfectivo = porMedio.find((m) => m.medioPago === MEDIO_EFECTIVO)?.total ?? 0;

    return {
      cantidadVentas: porMedio.reduce((suma, m) => suma + m.cantidad, 0),
      totalVentas: redondear(porMedio.reduce((suma, m) => suma + m.total, 0)),
      porMedioDePago: porMedio,
      ingresos,
      egresos,
      efectivoEsperado: redondear(caja.montoInicial + ventasEfectivo + ingresos - egresos),
    };
  },

  async registrarMovimiento(cajaId: string, tipo: TipoMovimientoCaja, monto: number, motivo: string, usuarioId: string) {
    await obtenerDb().insert(movimientosCaja).values({ cajaId, tipo, monto, motivo, usuarioId });
  },

  listarMovimientos(cajaId: string) {
    return obtenerDb()
      .select({ ...getTableColumns(movimientosCaja), usuarioNombre: usuarios.nombre })
      .from(movimientosCaja)
      .innerJoin(usuarios, eq(movimientosCaja.usuarioId, usuarios.id))
      .where(eq(movimientosCaja.cajaId, cajaId))
      .orderBy(desc(movimientosCaja.creadoEn));
  },

  /**
   * Cierra la caja abierta. Bloquea la fila (FOR UPDATE) para que no entre una
   * venta mientras se calcula el efectivo esperado.
   */
  async cerrar(cajaId: string, usuarioId: string, efectivoContado: number, nota: string | null) {
    return obtenerDb().transaction(async (tx) => {
      const [caja] = await tx
        .select({ id: cajas.id, montoInicial: cajas.montoInicial })
        .from(cajas)
        .where(and(eq(cajas.id, cajaId), isNull(cajas.cerradaEn)))
        .for('update');
      if (!caja) return false;

      const { efectivoEsperado } = await this.resumen(caja, tx);
      await tx
        .update(cajas)
        .set({
          cerradaPor: usuarioId,
          cerradaEn: new Date(),
          efectivoEsperado,
          efectivoContado,
          diferencia: redondear(efectivoContado - efectivoEsperado),
          notaCierre: nota,
        })
        .where(eq(cajas.id, cajaId));
      return true;
    });
  },

  async listarCerradas(filtros: FiltrosCajas) {
    const donde = and(isNotNull(cajas.cerradaEn), ...entreFechas(cajas.abiertaEn, filtros));
    const [items, [totales]] = await Promise.all([
      consultaCajas(obtenerDb())
        .where(donde)
        .orderBy(desc(cajas.abiertaEn))
        .limit(filtros.porPagina)
        .offset((filtros.pagina - 1) * filtros.porPagina),
      obtenerDb().select({ total: sql<number>`count(*)`.mapWith(Number) }).from(cajas).where(donde),
    ]);
    return { items, total: totales?.total ?? 0 };
  },
};
