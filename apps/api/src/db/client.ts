import type { EstadoBaseDeDatos } from '@stock/shared';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import { errores } from '../shared/errors/AppError';
import * as schema from './schema';

export type BaseDeDatos = PostgresJsDatabase<typeof schema>;

/**
 * La conexión se crea solo si hay DATABASE_URL, así la API puede arrancar
 * aunque todavía no esté configurada la base.
 * `prepare: false` es necesario para los poolers de Supabase.
 */
const conexion = env.DATABASE_URL
  ? postgres(env.DATABASE_URL, { prepare: false, max: 10, connect_timeout: 10 })
  : null;

let instancia: BaseDeDatos | null = null;

/** Devuelve el cliente de Drizzle. Usar siempre desde los repositories. */
export function obtenerDb(): BaseDeDatos {
  if (!conexion) {
    throw errores.servicioNoDisponible('La base de datos no está configurada (falta DATABASE_URL).');
  }
  instancia ??= drizzle(conexion, { schema, casing: 'snake_case' });
  return instancia;
}

export async function verificarConexion(): Promise<EstadoBaseDeDatos> {
  if (!conexion) return 'sin_configurar';
  try {
    await conexion`select 1`;
    return 'conectada';
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    return 'error';
  }
}

export async function cerrarConexion(): Promise<void> {
  await conexion?.end({ timeout: 5 });
}
