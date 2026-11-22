import { defineConfig } from 'drizzle-kit';
import { cargarEnv } from './src/config/cargarEnv';

// La misma carga que la API: `npm run bella -- db:migrate` migra la base de Bella.
cargarEnv();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // En TypeScript escribimos camelCase (precioVenta) y en la base queda snake_case (precio_venta).
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
