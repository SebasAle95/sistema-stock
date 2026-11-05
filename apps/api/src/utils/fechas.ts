import { negocio } from '@stock/shared';
import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/** Inicio del día `fecha` (AAAA-MM-DD) en la zona horaria del negocio, como timestamptz. */
export const inicioDelDia = (fecha: string) => sql`(${fecha}::date)::timestamp at time zone ${negocio.zonaHoraria}`;

/** Inicio del día siguiente a `fecha`, para usar como límite exclusivo. */
export const inicioDelDiaSiguiente = (fecha: string) =>
  sql`(${fecha}::date + 1)::timestamp at time zone ${negocio.zonaHoraria}`;

/** Condiciones para filtrar una columna de fecha por días completos (inclusive) en hora del negocio. */
export function entreFechas(columna: PgColumn, rango: { desde?: string; hasta?: string }): SQL[] {
  const condiciones: SQL[] = [];
  if (rango.desde) condiciones.push(sql`${columna} >= ${inicioDelDia(rango.desde)}`);
  if (rango.hasta) condiciones.push(sql`${columna} < ${inicioDelDiaSiguiente(rango.hasta)}`);
  return condiciones;
}

/** Redondea a centavos (evita 0.1 + 0.2 = 0.30000000000000004). */
export const redondear = (valor: number) => Math.round(valor * 100) / 100;
