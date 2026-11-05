import { negocio, normalizarParaBusqueda, type FiltrosMovimientos } from '@stock/shared';
import { and, desc, eq, getTableColumns, inArray, like, sql, type SQL } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { movimientosStock, productos, usuarios } from '../../db/schema';

interface ItemIngreso {
  productoId: string;
  cantidad: number;
  costoUnitario: number | null;
}

/** Inicio del día `fecha` (AAAA-MM-DD) en la zona horaria del negocio. */
const inicioDelDia = (fecha: string) => sql`(${fecha}::date)::timestamp at time zone ${negocio.zonaHoraria}`;
const inicioDelDiaSiguiente = (fecha: string) =>
  sql`(${fecha}::date + 1)::timestamp at time zone ${negocio.zonaHoraria}`;

function condicionesMovimientos(filtros: FiltrosMovimientos): SQL | undefined {
  const lista: (SQL | undefined)[] = [];
  if (filtros.tipo) lista.push(eq(movimientosStock.tipo, filtros.tipo));
  if (filtros.desde) lista.push(sql`${movimientosStock.creadoEn} >= ${inicioDelDia(filtros.desde)}`);
  if (filtros.hasta) lista.push(sql`${movimientosStock.creadoEn} < ${inicioDelDiaSiguiente(filtros.hasta)}`);
  if (filtros.buscar) {
    const palabras = normalizarParaBusqueda(filtros.buscar).split(' ').filter(Boolean);
    lista.push(...palabras.map((p) => like(productos.nombreBusqueda, `%${p.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)));
  }
  return and(...lista);
}

export const stockRepository = {
  buscarProductos(ids: string[]) {
    return obtenerDb()
      .select({
        id: productos.id,
        nombre: productos.nombre,
        stock: productos.stock,
        activo: productos.activo,
        controlaStock: productos.controlaStock,
      })
      .from(productos)
      .where(inArray(productos.id, ids));
  },

  /**
   * Suma el stock de cada producto y registra un movimiento por cada uno, todo en
   * una transacción: si algo falla, no se carga nada. El `stock + cantidad` lo
   * hace la base, así dos ingresos simultáneos no se pisan.
   */
  async registrarIngreso(items: ItemIngreso[], usuarioId: string, nota: string | null, actualizarCosto: boolean) {
    await obtenerDb().transaction(async (tx) => {
      for (const item of items) {
        const [producto] = await tx
          .update(productos)
          .set({
            stock: sql`${productos.stock} + ${item.cantidad}`,
            ...(actualizarCosto && item.costoUnitario !== null ? { precioCosto: item.costoUnitario } : {}),
          })
          .where(eq(productos.id, item.productoId))
          .returning({ stock: productos.stock });
        if (!producto) throw new Error(`Producto ${item.productoId} no encontrado`);

        await tx.insert(movimientosStock).values({
          productoId: item.productoId,
          tipo: 'ingreso',
          cantidad: item.cantidad,
          stockResultante: producto.stock,
          costoUnitario: item.costoUnitario,
          nota,
          usuarioId,
        });
      }
    });
  },

  /**
   * Aplica un ajuste o merma. Bloquea la fila del producto (FOR UPDATE) para
   * calcular la diferencia sobre el stock real del momento.
   * `calcularCambio` recibe el stock actual y devuelve cuánto sumar (negativo para restar).
   */
  async aplicarAjuste(
    productoId: string,
    tipo: 'ajuste' | 'merma',
    calcularCambio: (stockActual: number) => number,
    usuarioId: string,
    nota: string | null,
  ) {
    return obtenerDb().transaction(async (tx) => {
      const [actual] = await tx
        .select({ stock: productos.stock })
        .from(productos)
        .where(eq(productos.id, productoId))
        .for('update');
      if (!actual) throw new Error('Producto no encontrado');

      const cambio = calcularCambio(actual.stock);
      const stockResultante = actual.stock + cambio;

      await tx.update(productos).set({ stock: stockResultante }).where(eq(productos.id, productoId));
      await tx.insert(movimientosStock).values({ productoId, tipo, cantidad: cambio, stockResultante, nota, usuarioId });

      return { stockAnterior: actual.stock, stockResultante };
    });
  },

  async listarMovimientos(filtros: FiltrosMovimientos) {
    const donde = condicionesMovimientos(filtros);
    const [items, [totales]] = await Promise.all([
      obtenerDb()
        .select({
          ...getTableColumns(movimientosStock),
          productoNombre: productos.nombre,
          usuarioNombre: usuarios.nombre,
        })
        .from(movimientosStock)
        .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
        .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
        .where(donde)
        .orderBy(desc(movimientosStock.creadoEn))
        .limit(filtros.porPagina)
        .offset((filtros.pagina - 1) * filtros.porPagina),
      obtenerDb()
        .select({ total: sql<number>`count(*)::int` })
        .from(movimientosStock)
        .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
        .where(donde),
    ]);
    return { items, total: totales?.total ?? 0 };
  },
};
