import { numeric, timestamp } from 'drizzle-orm/pg-core';

/** Fecha y hora con zona horaria. */
export const fecha = () => timestamp({ withTimezone: true });

/** Importes con 2 decimales exactos (numeric, no float). En TypeScript llegan como number. */
export const dinero = () => numeric({ precision: 12, scale: 2, mode: 'number' });
