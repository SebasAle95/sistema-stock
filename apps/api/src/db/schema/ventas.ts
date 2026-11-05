import { TIPOS_MOVIMIENTO_CAJA } from '@stock/shared';
import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dinero, fecha } from './columnas';
import { productos } from './productos';
import { usuarios } from './usuarios';

/**
 * Turnos de caja. Solo puede haber una abierta a la vez (se vende desde una sola
 * compu): lo garantiza el índice único parcial sobre las cajas sin cerrar.
 */
export const cajas = pgTable(
  'cajas',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Número correlativo para mostrar ("Caja #12"). */
    numero: integer().generatedAlwaysAsIdentity(),
    abiertaPor: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    abiertaEn: fecha().notNull().defaultNow(),
    /** Efectivo con el que arranca (cambio). */
    montoInicial: dinero().notNull(),
    cerradaPor: uuid().references(() => usuarios.id, { onDelete: 'restrict' }),
    cerradaEn: fecha(),
    /** Calculado al cerrar: inicial + ventas en efectivo + ingresos − egresos. */
    efectivoEsperado: dinero(),
    /** Lo que se contó a mano al cerrar. */
    efectivoContado: dinero(),
    /** contado − esperado (negativo = falta plata). */
    diferencia: dinero(),
    notaCierre: text(),
  },
  (tabla) => [
    uniqueIndex('cajas_una_sola_abierta')
      .on(sql`(${tabla.cerradaEn} is null)`)
      .where(sql`${tabla.cerradaEn} is null`),
    index().on(tabla.abiertaEn),
  ],
).enableRLS();

export const tipoMovimientoCaja = pgEnum('tipo_movimiento_caja', TIPOS_MOVIMIENTO_CAJA);

/** Efectivo que entra o sale de la caja sin ser una venta (pago a proveedor, retiro, cambio). */
export const movimientosCaja = pgTable(
  'movimientos_caja',
  {
    id: uuid().primaryKey().defaultRandom(),
    cajaId: uuid()
      .notNull()
      .references(() => cajas.id, { onDelete: 'restrict' }),
    tipo: tipoMovimientoCaja().notNull(),
    monto: dinero().notNull(),
    motivo: text().notNull(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    creadoEn: fecha().notNull().defaultNow(),
  },
  (tabla) => [index().on(tabla.cajaId)],
).enableRLS();

export const ventas = pgTable(
  'ventas',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Número de ticket correlativo. */
    numero: integer().generatedAlwaysAsIdentity(),
    cajaId: uuid()
      .notNull()
      .references(() => cajas.id, { onDelete: 'restrict' }),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    total: dinero().notNull(),
    /** Id de `negocio.mediosDePago` (efectivo, transferencia, mercado_pago...). */
    medioPago: text().notNull(),
    montoRecibido: dinero(),
    vuelto: dinero(),
    anulada: boolean().notNull().default(false),
    anuladaPor: uuid().references(() => usuarios.id, { onDelete: 'restrict' }),
    anuladaEn: fecha(),
    motivoAnulacion: text(),
    creadoEn: fecha().notNull().defaultNow(),
  },
  (tabla) => [index().on(tabla.creadoEn), index().on(tabla.cajaId)],
).enableRLS();

/** Renglones de cada venta, con precio y costo "congelados" al momento de vender. */
export const ventaItems = pgTable(
  'venta_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    ventaId: uuid()
      .notNull()
      .references(() => ventas.id, { onDelete: 'cascade' }),
    productoId: uuid()
      .notNull()
      .references(() => productos.id, { onDelete: 'restrict' }),
    nombre: text().notNull(),
    cantidad: integer().notNull(),
    precioUnitario: dinero().notNull(),
    /** Costo al momento de vender: la ganancia de ayer no cambia si mañana sube el costo. */
    costoUnitario: dinero(),
    subtotal: dinero().notNull(),
  },
  (tabla) => [index().on(tabla.ventaId), index().on(tabla.productoId)],
).enableRLS();

export type FilaCaja = typeof cajas.$inferSelect;
export type FilaVenta = typeof ventas.$inferSelect;
export type FilaVentaItem = typeof ventaItems.$inferSelect;
