import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ quiet: true });

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
