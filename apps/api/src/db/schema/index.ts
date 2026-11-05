/**
 * Esquema de la base de datos (Drizzle).
 *
 * Cada módulo define sus tablas en su propio archivo dentro de esta carpeta
 * y se re-exporta acá.
 *
 * Después de cambiar el esquema:
 *   npm run db:generate   → crea el archivo de migración SQL en apps/api/drizzle
 *   npm run db:migrate    → aplica las migraciones pendientes en la base
 */
export * from './usuarios';
