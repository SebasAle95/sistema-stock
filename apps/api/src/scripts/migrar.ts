/**
 * Aplica las migraciones pendientes de `drizzle/` y termina.
 *
 * Es lo mismo que `npm run db:migrate` (usa la misma tabla `drizzle.__drizzle_migrations`),
 * pero sin drizzle-kit: así corre en la imagen de producción, que no trae las herramientas
 * de desarrollo. Se ejecuta desde `apps/api`:
 *
 *   node dist/migrar.js
 */
import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { cerrarConexion, obtenerDb } from '../db/client';

const carpeta = path.resolve('drizzle');

try {
  console.log(`Aplicando migraciones de ${carpeta}...`);
  await migrate(obtenerDb(), { migrationsFolder: carpeta });
  console.log('✅ Base de datos al día.');
} catch (error) {
  console.error('❌ No se pudieron aplicar las migraciones:', error);
  process.exitCode = 1;
} finally {
  await cerrarConexion();
}
