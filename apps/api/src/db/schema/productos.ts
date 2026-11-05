import { TIPOS_MOVIMIENTO_STOCK } from '@stock/shared';
import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dinero, fecha } from './columnas';
import { usuarios } from './usuarios';
import { ventas } from './ventas';

export const categorias = pgTable(
  'categorias',
  {
    id: uuid().primaryKey().defaultRandom(),
    nombre: text().notNull(),
    creadoEn: fecha().notNull().defaultNow(),
  },
  // Sin repetidos aunque cambien mayúsculas ("Bebidas" = "bebidas").
  (tabla) => [uniqueIndex('categorias_nombre_unico').on(sql`lower(${tabla.nombre})`)],
).enableRLS();

export const productos = pgTable(
  'productos',
  {
    id: uuid().primaryKey().defaultRandom(),
    nombre: text().notNull(),
    /** Nombre sin acentos y en minúsculas, para buscar "cafe" y encontrar "Café". */
    nombreBusqueda: text().notNull(),
    /** Opcional: los productos sin código se buscan por nombre o con botón rápido. */
    codigoBarras: text().unique(),
    categoriaId: uuid().references(() => categorias.id, { onDelete: 'set null' }),
    precioVenta: dinero().notNull(),
    precioCosto: dinero(),
    /**
     * Stock actual. Nunca se edita directo: cambia junto con un registro en
     * movimientos_stock, dentro de la misma transacción.
     */
    stock: integer().notNull().default(0),
    stockMinimo: integer().notNull().default(0),
    /**
     * false para lo que se prepara en el momento (café, sándwich): no lleva
     * stock, no genera alertas y las ventas no lo descuentan.
     */
    controlaStock: boolean().notNull().default(true),
    accesoRapido: boolean().notNull().default(false),
    /** Desactivar en vez de borrar: las ventas quedan asociadas al producto. */
    activo: boolean().notNull().default(true),
    creadoEn: fecha().notNull().defaultNow(),
    actualizadoEn: fecha()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (tabla) => [index().on(tabla.categoriaId), index().on(tabla.nombreBusqueda)],
).enableRLS();

export const tipoMovimientoStock = pgEnum('tipo_movimiento_stock', TIPOS_MOVIMIENTO_STOCK);

/** Historial de cada cambio de stock: qué, cuánto, quién y cuándo. */
export const movimientosStock = pgTable(
  'movimientos_stock',
  {
    id: uuid().primaryKey().defaultRandom(),
    productoId: uuid()
      .notNull()
      .references(() => productos.id, { onDelete: 'restrict' }),
    tipo: tipoMovimientoStock().notNull(),
    /** Positiva si entra mercadería, negativa si sale. */
    cantidad: integer().notNull(),
    /** Stock del producto después de este movimiento. */
    stockResultante: integer().notNull(),
    /** Costo por unidad en ese momento (ingresos de mercadería). */
    costoUnitario: dinero(),
    nota: text(),
    /** Venta que originó el movimiento, si corresponde. */
    ventaId: uuid().references(() => ventas.id, { onDelete: 'restrict' }),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'restrict' }),
    creadoEn: fecha().notNull().defaultNow(),
  },
  (tabla) => [index().on(tabla.productoId, tabla.creadoEn), index().on(tabla.creadoEn)],
).enableRLS();

export type FilaCategoria = typeof categorias.$inferSelect;
export type FilaProducto = typeof productos.$inferSelect;
export type NuevaFilaProducto = typeof productos.$inferInsert;
export type FilaMovimientoStock = typeof movimientosStock.$inferSelect;
