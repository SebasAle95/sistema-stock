import { and, inArray, isNull, sql } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { productos } from '../../db/schema';
import { generarCodigosInternos } from '../productos/codigosInternos';
import { consultaBase } from '../productos/productos.repository';

export const etiquetasRepository = {
  /** A los productos de la lista que no tienen código les asigna uno interno. Devuelve cuántos. */
  async asignarCodigos(ids: string[]): Promise<number> {
    return obtenerDb().transaction(async (tx) => {
      const sinCodigo = await tx
        .select({ id: productos.id })
        .from(productos)
        .where(and(inArray(productos.id, ids), isNull(productos.codigoBarras)))
        .for('update');
      if (sinCodigo.length === 0) return 0;

      const codigos = await generarCodigosInternos(tx, sinCodigo.length);
      const valores = sql.join(
        sinCodigo.map((p, i) => sql`(${p.id}::uuid, ${codigos[i]})`),
        sql`, `,
      );
      await tx.execute(sql`
        update ${productos}
        set codigo_barras = v.codigo, actualizado_en = now()
        from (values ${valores}) as v(id, codigo)
        where ${productos.id} = v.id`);
      return sinCodigo.length;
    });
  },

  buscarProductos(ids: string[]) {
    return consultaBase().where(inArray(productos.id, ids));
  },
};
