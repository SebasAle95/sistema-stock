import { codigoInterno } from '@stock/shared';
import { inArray, sql } from 'drizzle-orm';
import type { Transaccion } from '../../db/client';
import { productos } from '../../db/schema';

/**
 * Pide a la base `cantidad` códigos internos nuevos (EAN-13 que empiezan con 21).
 * Saltea los que ya estén usados, por ejemplo si alguien escribió uno a mano,
 * y los de `reservados` (códigos que se van a guardar en la misma operación).
 */
export async function generarCodigosInternos(
  tx: Transaccion,
  cantidad: number,
  reservados: Iterable<string> = [],
): Promise<string[]> {
  const codigos: string[] = [];
  const ocupados = new Set(reservados);

  while (codigos.length < cantidad) {
    const faltan = cantidad - codigos.length;
    const filas = await tx.execute<{ numero: string }>(
      sql`select nextval('codigos_internos_seq')::text as numero from generate_series(1, ${faltan})`,
    );
    const candidatos = filas.map((fila) => codigoInterno(Number(fila.numero)));
    const enUso = await tx
      .select({ codigo: productos.codigoBarras })
      .from(productos)
      .where(inArray(productos.codigoBarras, candidatos));
    for (const { codigo } of enUso) if (codigo) ocupados.add(codigo);
    codigos.push(...candidatos.filter((codigo) => !ocupados.has(codigo)));
  }
  return codigos;
}
