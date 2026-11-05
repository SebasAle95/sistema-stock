import { ROLES } from '@stock/shared';
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const rolUsuario = pgEnum('rol_usuario', ROLES);

const fecha = () => timestamp({ withTimezone: true });

/**
 * Usuarios del sistema. No hay registro público: los crea el administrador.
 *
 * `enableRLS()` activa Row Level Security sin políticas: la API pública de Supabase
 * (anon/authenticated) no puede leer ni escribir esta tabla. Nuestra API se conecta
 * como dueña de las tablas, así que no se ve afectada.
 */
export const usuarios = pgTable('usuarios', {
  id: uuid().primaryKey().defaultRandom(),
  nombre: text().notNull(),
  /** Nombre de usuario para ingresar. Siempre en minúsculas. */
  usuario: text().notNull().unique(),
  /** Hash bcrypt. Nunca se guarda ni se devuelve la contraseña. */
  passwordHash: text().notNull(),
  rol: rolUsuario().notNull().default('vendedor'),
  /** Desactivar en vez de borrar: las ventas y cierres de caja quedan asociados a su usuario. */
  activo: boolean().notNull().default(true),
  /** true cuando la contraseña la puso el administrador: hay que cambiarla al ingresar. */
  debeCambiarPassword: boolean().notNull().default(true),
  intentosFallidos: integer().notNull().default(0),
  bloqueadoHasta: fecha(),
  ultimoAcceso: fecha(),
  creadoEn: fecha().notNull().defaultNow(),
  actualizadoEn: fecha()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

/**
 * Sesiones activas. En la cookie viaja un token aleatorio; acá se guarda solo su
 * hash SHA-256, así una filtración de la base no permite usar sesiones ajenas.
 */
export const sesiones = pgTable(
  'sesiones',
  {
    id: uuid().primaryKey().defaultRandom(),
    tokenHash: text().notNull().unique(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    expiraEn: fecha().notNull(),
    ip: text(),
    agenteDeUsuario: text(),
    creadoEn: fecha().notNull().defaultNow(),
  },
  (tabla) => [index().on(tabla.usuarioId)],
).enableRLS();

export type FilaUsuario = typeof usuarios.$inferSelect;
export type NuevaFilaUsuario = typeof usuarios.$inferInsert;
export type FilaSesion = typeof sesiones.$inferSelect;
