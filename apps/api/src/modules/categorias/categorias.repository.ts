import { asc, count, eq, ne, sql, and } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { categorias, productos, type FilaCategoria } from '../../db/schema';

export const categoriasRepository = {
  listarConCantidad() {
    return obtenerDb()
      .select({ id: categorias.id, nombre: categorias.nombre, cantidadProductos: count(productos.id) })
      .from(categorias)
      .leftJoin(productos, eq(productos.categoriaId, categorias.id))
      .groupBy(categorias.id)
      .orderBy(asc(sql`lower(${categorias.nombre})`));
  },

  async buscarPorId(id: string): Promise<FilaCategoria | undefined> {
    const [fila] = await obtenerDb().select().from(categorias).where(eq(categorias.id, id)).limit(1);
    return fila;
  },

  /** Busca por nombre sin importar mayúsculas, opcionalmente ignorando una categoría. */
  async buscarPorNombre(nombre: string, exceptoId?: string): Promise<FilaCategoria | undefined> {
    const [fila] = await obtenerDb()
      .select()
      .from(categorias)
      .where(
        and(
          sql`lower(${categorias.nombre}) = lower(${nombre})`,
          exceptoId ? ne(categorias.id, exceptoId) : undefined,
        ),
      )
      .limit(1);
    return fila;
  },

  async crear(nombre: string): Promise<FilaCategoria> {
    const [fila] = await obtenerDb().insert(categorias).values({ nombre }).returning();
    if (!fila) throw new Error('No se pudo crear la categoría');
    return fila;
  },

  async renombrar(id: string, nombre: string): Promise<FilaCategoria | undefined> {
    const [fila] = await obtenerDb().update(categorias).set({ nombre }).where(eq(categorias.id, id)).returning();
    return fila;
  },

  /** Los productos de la categoría quedan "sin categoría" (ON DELETE SET NULL). */
  async eliminar(id: string): Promise<boolean> {
    const filas = await obtenerDb().delete(categorias).where(eq(categorias.id, id)).returning({ id: categorias.id });
    return filas.length > 0;
  },
};
