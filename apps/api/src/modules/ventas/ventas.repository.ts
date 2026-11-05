import type { FiltrosVentas } from '@stock/shared';
import { and, asc, desc, eq, getTableColumns, inArray, isNull, sql } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { cajas, movimientosStock, productos, usuarios, ventaItems, ventas } from '../../db/schema';
import { entreFechas } from '../../utils/fechas';
import { cajaCerrada } from '../caja/caja.service';

export interface LineaVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number | null;
  subtotal: number;
  controlaStock: boolean;
}

interface NuevaVenta {
  usuarioId: string;
  medioPago: string;
  total: number;
  montoRecibido: number | null;
  vuelto: number | null;
  lineas: LineaVenta[];
}

const columnasVenta = { ...getTableColumns(ventas), usuarioNombre: usuarios.nombre };

async function conItems<T extends { id: string }>(filas: T[]) {
  if (filas.length === 0) return [];
  const items = await obtenerDb()
    .select()
    .from(ventaItems)
    .where(inArray(ventaItems.ventaId, filas.map((f) => f.id)))
    .orderBy(asc(ventaItems.nombre));
  return filas.map((fila) => ({ ...fila, items: items.filter((i) => i.ventaId === fila.id) }));
}

export const ventasRepository = {
  buscarProductos(ids: string[]) {
    return obtenerDb()
      .select({
        id: productos.id,
        nombre: productos.nombre,
        precioVenta: productos.precioVenta,
        precioCosto: productos.precioCosto,
        controlaStock: productos.controlaStock,
        activo: productos.activo,
      })
      .from(productos)
      .where(inArray(productos.id, ids));
  },

  /**
   * Registra la venta completa en una transacción: la venta, sus renglones y el
   * descuento de stock con su movimiento. Si algo falla, no queda nada a medias.
   */
  async registrar(venta: NuevaVenta): Promise<string> {
    return obtenerDb().transaction(async (tx) => {
      // La caja se bloquea "para compartir": varias ventas a la vez sí, cerrarla en el medio no.
      const [caja] = await tx.select({ id: cajas.id }).from(cajas).where(isNull(cajas.cerradaEn)).for('share');
      if (!caja) throw cajaCerrada();

      const [creada] = await tx
        .insert(ventas)
        .values({
          cajaId: caja.id,
          usuarioId: venta.usuarioId,
          total: venta.total,
          medioPago: venta.medioPago,
          montoRecibido: venta.montoRecibido,
          vuelto: venta.vuelto,
        })
        .returning({ id: ventas.id });
      if (!creada) throw new Error('No se pudo registrar la venta');

      await tx.insert(ventaItems).values(
        venta.lineas.map((l) => ({
          ventaId: creada.id,
          productoId: l.productoId,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          costoUnitario: l.costoUnitario,
          subtotal: l.subtotal,
        })),
      );

      for (const linea of venta.lineas.filter((l) => l.controlaStock)) {
        const [producto] = await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${linea.cantidad}` })
          .where(eq(productos.id, linea.productoId))
          .returning({ stock: productos.stock });
        if (!producto) throw new Error('Producto no encontrado al descontar stock');

        await tx.insert(movimientosStock).values({
          productoId: linea.productoId,
          tipo: 'venta',
          cantidad: -linea.cantidad,
          stockResultante: producto.stock,
          ventaId: creada.id,
          usuarioId: venta.usuarioId,
        });
      }
      return creada.id;
    });
  },

  async buscarPorId(id: string) {
    const filas = await obtenerDb()
      .select(columnasVenta)
      .from(ventas)
      .innerJoin(usuarios, eq(ventas.usuarioId, usuarios.id))
      .where(eq(ventas.id, id))
      .limit(1);
    return (await conItems(filas))[0];
  },

  async listar(filtros: FiltrosVentas) {
    const donde = and(
      filtros.cajaId ? eq(ventas.cajaId, filtros.cajaId) : undefined,
      ...entreFechas(ventas.creadoEn, filtros),
    );
    const [filas, [totales]] = await Promise.all([
      obtenerDb()
        .select(columnasVenta)
        .from(ventas)
        .innerJoin(usuarios, eq(ventas.usuarioId, usuarios.id))
        .where(donde)
        .orderBy(desc(ventas.creadoEn))
        .limit(filtros.porPagina)
        .offset((filtros.pagina - 1) * filtros.porPagina),
      obtenerDb().select({ total: sql<number>`count(*)`.mapWith(Number) }).from(ventas).where(donde),
    ]);
    return { items: await conItems(filas), total: totales?.total ?? 0 };
  },

  /**
   * Anula la venta y devuelve exactamente el stock que se descontó (según sus
   * movimientos). Solo si la venta es de la caja abierta: una caja cerrada no se toca.
   * Devuelve un motivo de rechazo, o null si se anuló.
   */
  async anular(ventaId: string, usuarioId: string, motivo: string): Promise<string | null> {
    return obtenerDb().transaction(async (tx) => {
      const [venta] = await tx
        .select({ anulada: ventas.anulada, cajaCerrada: cajas.cerradaEn })
        .from(ventas)
        .innerJoin(cajas, eq(ventas.cajaId, cajas.id))
        .where(eq(ventas.id, ventaId))
        .for('update', { of: ventas });
      if (!venta) return 'No existe la venta';
      if (venta.anulada) return 'La venta ya estaba anulada';
      if (venta.cajaCerrada) return 'Solo se pueden anular ventas de la caja abierta';

      await tx
        .update(ventas)
        .set({ anulada: true, anuladaPor: usuarioId, anuladaEn: new Date(), motivoAnulacion: motivo })
        .where(eq(ventas.id, ventaId));

      const descontados = await tx
        .select({ productoId: movimientosStock.productoId, cantidad: movimientosStock.cantidad })
        .from(movimientosStock)
        .where(and(eq(movimientosStock.ventaId, ventaId), eq(movimientosStock.tipo, 'venta')));

      for (const mov of descontados) {
        const devolver = -mov.cantidad;
        const [producto] = await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} + ${devolver}` })
          .where(eq(productos.id, mov.productoId))
          .returning({ stock: productos.stock });
        if (!producto) continue;
        await tx.insert(movimientosStock).values({
          productoId: mov.productoId,
          tipo: 'anulacion_venta',
          cantidad: devolver,
          stockResultante: producto.stock,
          ventaId,
          nota: motivo,
          usuarioId,
        });
      }
      return null;
    });
  },
};
