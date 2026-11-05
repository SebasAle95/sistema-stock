import type { FiltrosProductos } from '@stock/shared';
import { normalizarParaBusqueda } from '@stock/shared';
import { and, asc, count, eq, getTableColumns, isNull, like, ne, or, sql, type SQL } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { categorias, movimientosStock, productos, type NuevaFilaProducto } from '../../db/schema';

/** Columnas del producto + el nombre de su categoría. */
const columnas = { ...getTableColumns(productos), categoriaNombre: categorias.nombre };

export type FilaProductoConCategoria = typeof productos.$inferSelect & { categoriaNombre: string | null };

/** Escapa los comodines de LIKE para buscar el texto tal cual. */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function condiciones(filtros: FiltrosProductos): SQL | undefined {
  const lista: (SQL | undefined)[] = [];

  if (filtros.estado === 'activos') lista.push(eq(productos.activo, true));
  if (filtros.estado === 'inactivos') lista.push(eq(productos.activo, false));

  if (filtros.categoriaId === 'sin') lista.push(isNull(productos.categoriaId));
  else if (filtros.categoriaId) lista.push(eq(productos.categoriaId, filtros.categoriaId));

  if (filtros.stockBajo) {
    lista.push(eq(productos.controlaStock, true), sql`${productos.stock} <= ${productos.stockMinimo}`);
  }
  if (filtros.accesoRapido) lista.push(eq(productos.accesoRapido, true));

  if (filtros.buscar) {
    // Cada palabra tiene que aparecer en el nombre ("coca 500" encuentra "Coca-Cola 500 ml"),
    // o el texto es el comienzo del código de barras.
    const palabras = normalizarParaBusqueda(filtros.buscar).split(' ').filter(Boolean);
    const porNombre = and(...palabras.map((p) => like(productos.nombreBusqueda, `%${escaparLike(p)}%`)));
    const porCodigo = like(productos.codigoBarras, `${escaparLike(filtros.buscar)}%`);
    lista.push(or(porNombre, porCodigo));
  }

  return and(...lista);
}

function consultaBase() {
  return obtenerDb().select(columnas).from(productos).leftJoin(categorias, eq(productos.categoriaId, categorias.id));
}

export const productosRepository = {
  async listar(filtros: FiltrosProductos) {
    const donde = condiciones(filtros);
    const [items, [totales]] = await Promise.all([
      consultaBase()
        .where(donde)
        .orderBy(asc(productos.nombreBusqueda))
        .limit(filtros.porPagina)
        .offset((filtros.pagina - 1) * filtros.porPagina),
      obtenerDb().select({ total: count() }).from(productos).where(donde),
    ]);
    return { items, total: totales?.total ?? 0 };
  },

  async buscarPorId(id: string): Promise<FilaProductoConCategoria | undefined> {
    const [fila] = await consultaBase().where(eq(productos.id, id)).limit(1);
    return fila;
  },

  async buscarPorCodigo(codigo: string, exceptoId?: string): Promise<FilaProductoConCategoria | undefined> {
    const [fila] = await consultaBase()
      .where(and(eq(productos.codigoBarras, codigo), exceptoId ? ne(productos.id, exceptoId) : undefined))
      .limit(1);
    return fila;
  },

  /** Crea el producto y, si arranca con stock, registra el movimiento "inicial" en la misma transacción. */
  async crear(datos: Omit<NuevaFilaProducto, 'stock'>, stockInicial: number, usuarioId: string): Promise<string> {
    return obtenerDb().transaction(async (tx) => {
      const [creado] = await tx
        .insert(productos)
        .values({ ...datos, stock: stockInicial })
        .returning({ id: productos.id });
      if (!creado) throw new Error('No se pudo crear el producto');

      if (stockInicial > 0) {
        await tx.insert(movimientosStock).values({
          productoId: creado.id,
          tipo: 'inicial',
          cantidad: stockInicial,
          stockResultante: stockInicial,
          costoUnitario: datos.precioCosto ?? null,
          usuarioId,
        });
      }
      return creado.id;
    });
  },

  async actualizar(id: string, cambios: Partial<Omit<NuevaFilaProducto, 'stock'>>): Promise<boolean> {
    const filas = await obtenerDb()
      .update(productos)
      .set(cambios)
      .where(eq(productos.id, id))
      .returning({ id: productos.id });
    return filas.length > 0;
  },
};
