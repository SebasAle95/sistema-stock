import { nombreVariante, normalizarParaBusqueda, type DatosCombinacion, type FiltrosModelos } from '@stock/shared';
import { and, asc, count, eq, getTableColumns, inArray, isNull, like, sql, type SQL } from 'drizzle-orm';
import { obtenerDb, type Transaccion } from '../../db/client';
import { categorias, modelos, movimientosStock, productos, type FilaModelo } from '../../db/schema';
import { generarCodigosInternos } from '../productos/codigosInternos';
import { consultaBase } from '../productos/productos.repository';

export type FilaModeloConCategoria = FilaModelo & { categoriaNombre: string | null };

type DatosModelo = Pick<FilaModelo, 'nombre' | 'categoriaId' | 'precioVenta' | 'precioCosto' | 'stockMinimo'>;
type CambiosModelo = Partial<Pick<FilaModelo, 'nombre' | 'categoriaId' | 'precioVenta' | 'precioCosto' | 'stockMinimo'>>;

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Crea un producto por combinación de talle y color, con los datos del modelo.
 * Las que no traen código reciben uno interno, y las que arrancan con stock
 * registran su movimiento "inicial". Siempre dentro de la transacción del llamador.
 */
async function insertarCombinaciones(
  tx: Transaccion,
  modelo: FilaModelo,
  combinaciones: DatosCombinacion[],
  usuarioId: string,
): Promise<void> {
  const conCodigo = combinaciones.flatMap((c) => (c.codigoBarras ? [c.codigoBarras] : []));
  const internos = await generarCodigosInternos(tx, combinaciones.length - conCodigo.length, conCodigo);

  const creados = await tx
    .insert(productos)
    .values(
      combinaciones.map((c) => {
        const nombre = nombreVariante(modelo.nombre, c.color, c.talle);
        return {
          nombre,
          nombreBusqueda: normalizarParaBusqueda(nombre),
          codigoBarras: c.codigoBarras ?? internos.shift(),
          categoriaId: modelo.categoriaId,
          precioVenta: modelo.precioVenta,
          precioCosto: modelo.precioCosto,
          stock: c.stockInicial,
          stockMinimo: modelo.stockMinimo,
          modeloId: modelo.id,
          talle: c.talle,
          color: c.color,
        };
      }),
    )
    .returning({ id: productos.id, stock: productos.stock });

  const movimientos = creados
    .filter((p) => p.stock > 0)
    .map((p) => ({
      productoId: p.id,
      tipo: 'inicial' as const,
      cantidad: p.stock,
      stockResultante: p.stock,
      costoUnitario: modelo.precioCosto,
      usuarioId,
    }));
  if (movimientos.length > 0) await tx.insert(movimientosStock).values(movimientos);
}

/** Condiciones del listado sobre el modelo (WHERE) y sobre sus combinaciones (HAVING). */
function condiciones(filtros: FiltrosModelos): { donde: SQL | undefined; teniendo: SQL | undefined } {
  const donde: (SQL | undefined)[] = [];
  if (filtros.categoriaId === 'sin') donde.push(isNull(modelos.categoriaId));
  else if (filtros.categoriaId) donde.push(eq(modelos.categoriaId, filtros.categoriaId));
  if (filtros.buscar) {
    const palabras = normalizarParaBusqueda(filtros.buscar).split(' ').filter(Boolean);
    donde.push(...palabras.map((p) => like(modelos.nombreBusqueda, `%${escaparLike(p)}%`)));
  }

  const activas = sql`count(${productos.id}) filter (where ${productos.activo})`;
  const teniendo: SQL[] = [];
  if (filtros.estado === 'activos') teniendo.push(sql`${activas} > 0`);
  if (filtros.estado === 'inactivos') teniendo.push(sql`${activas} = 0`);
  if (filtros.stockBajo) {
    teniendo.push(sql`count(${productos.id}) filter (where ${productos.activo} and ${productos.stock} <= ${productos.stockMinimo}) > 0`);
  }
  return { donde: and(...donde), teniendo: and(...teniendo) };
}

export const modelosRepository = {
  async listar(filtros: FiltrosModelos) {
    const { donde, teniendo } = condiciones(filtros);
    const activa = sql`${productos.activo}`;

    const items = await obtenerDb()
      .select({
        id: modelos.id,
        nombre: modelos.nombre,
        categoriaId: modelos.categoriaId,
        categoriaNombre: categorias.nombre,
        precioVenta: modelos.precioVenta,
        combinaciones: sql<number>`count(${productos.id}) filter (where ${activa})`.mapWith(Number),
        stock: sql<number>`coalesce(sum(${productos.stock}) filter (where ${activa}), 0)`.mapWith(Number),
        combinacionesStockBajo: sql<number>`count(${productos.id}) filter (where ${activa} and ${productos.stock} <= ${productos.stockMinimo})`.mapWith(Number),
        talles: sql<string[]>`coalesce(array_agg(distinct ${productos.talle}) filter (where ${activa} and ${productos.talle} is not null), '{}')`,
        colores: sql<string[]>`coalesce(array_agg(distinct ${productos.color}) filter (where ${activa} and ${productos.color} is not null), '{}')`,
      })
      .from(modelos)
      .leftJoin(categorias, eq(modelos.categoriaId, categorias.id))
      .leftJoin(productos, eq(productos.modeloId, modelos.id))
      .where(donde)
      .groupBy(modelos.id, categorias.id)
      .having(teniendo)
      .orderBy(asc(modelos.nombreBusqueda))
      .limit(filtros.porPagina)
      .offset((filtros.pagina - 1) * filtros.porPagina);

    const coincidentes = obtenerDb()
      .select({ id: modelos.id })
      .from(modelos)
      .leftJoin(productos, eq(productos.modeloId, modelos.id))
      .where(donde)
      .groupBy(modelos.id)
      .having(teniendo)
      .as('coincidentes');
    const [totales] = await obtenerDb().select({ total: count() }).from(coincidentes);

    return { items, total: totales?.total ?? 0 };
  },

  async buscarPorId(id: string): Promise<FilaModeloConCategoria | undefined> {
    const [fila] = await obtenerDb()
      .select({ ...getTableColumns(modelos), categoriaNombre: categorias.nombre })
      .from(modelos)
      .leftJoin(categorias, eq(modelos.categoriaId, categorias.id))
      .where(eq(modelos.id, id))
      .limit(1);
    return fila;
  },

  /** Todas las combinaciones del modelo, activas o no. */
  variantes(modeloId: string) {
    return consultaBase().where(eq(productos.modeloId, modeloId));
  },

  /** Productos que ya usan alguno de estos códigos. */
  buscarCodigosUsados(codigos: string[]) {
    if (codigos.length === 0) return Promise.resolve([]);
    return obtenerDb()
      .select({ codigo: productos.codigoBarras, nombre: productos.nombre })
      .from(productos)
      .where(inArray(productos.codigoBarras, codigos));
  },

  /** Crea el modelo con todas sus combinaciones: o se crea todo, o nada. */
  async crear(datos: DatosModelo, combinaciones: DatosCombinacion[], usuarioId: string): Promise<string> {
    return obtenerDb().transaction(async (tx) => {
      const [modelo] = await tx
        .insert(modelos)
        .values({ ...datos, nombreBusqueda: normalizarParaBusqueda(datos.nombre) })
        .returning();
      if (!modelo) throw new Error('No se pudo crear el modelo');
      await insertarCombinaciones(tx, modelo, combinaciones, usuarioId);
      return modelo.id;
    });
  },

  async agregarCombinaciones(modeloId: string, combinaciones: DatosCombinacion[], usuarioId: string): Promise<boolean> {
    return obtenerDb().transaction(async (tx) => {
      // FOR UPDATE: si alguien edita el modelo al mismo tiempo, las combinaciones nuevas salen con sus datos finales.
      const [modelo] = await tx.select().from(modelos).where(eq(modelos.id, modeloId)).for('update');
      if (!modelo) return false;
      await insertarCombinaciones(tx, modelo, combinaciones, usuarioId);
      return true;
    });
  },

  /**
   * Cambia el modelo y lo mismo en todas sus combinaciones. Si cambia el nombre,
   * cada combinación se renombra con su color y su talle ("Remera lisa · Negro · M").
   */
  async actualizar(id: string, cambios: CambiosModelo): Promise<boolean> {
    return obtenerDb().transaction(async (tx) => {
      const filas = await tx
        .update(modelos)
        .set({
          ...cambios,
          ...(cambios.nombre ? { nombreBusqueda: normalizarParaBusqueda(cambios.nombre) } : {}),
        })
        .where(eq(modelos.id, id))
        .returning({ id: modelos.id });
      if (filas.length === 0) return false;

      const { nombre, ...paraTodas } = cambios;
      if (Object.keys(paraTodas).length > 0) {
        await tx.update(productos).set(paraTodas).where(eq(productos.modeloId, id));
      }

      if (nombre) {
        const variantes = await tx
          .select({ id: productos.id, talle: productos.talle, color: productos.color })
          .from(productos)
          .where(eq(productos.modeloId, id));
        if (variantes.length > 0) {
          const valores = sql.join(
            variantes.map((v) => {
              const completo = nombreVariante(nombre, v.color, v.talle);
              return sql`(${v.id}::uuid, ${completo}, ${normalizarParaBusqueda(completo)})`;
            }),
            sql`, `,
          );
          await tx.execute(sql`
            update ${productos}
            set nombre = v.nombre, nombre_busqueda = v.busqueda, actualizado_en = now()
            from (values ${valores}) as v(id, nombre, busqueda)
            where ${productos.id} = v.id`);
        }
      }
      return true;
    });
  },
};
