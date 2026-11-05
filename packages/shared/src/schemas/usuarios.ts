import { z } from 'zod';
import { ROLES } from '../auth/roles';
import { esquemaNombreUsuario, esquemaPasswordNueva } from './auth';

const esquemaNombre = z
  .string()
  .trim()
  .min(2, 'Tiene que tener al menos 2 caracteres')
  .max(80, 'Puede tener hasta 80 caracteres');

const esquemaRol = z.enum(ROLES, { error: 'Elegí un rol válido' });

export const esquemaCrearUsuario = z.object({
  nombre: esquemaNombre,
  usuario: esquemaNombreUsuario,
  rol: esquemaRol,
  /** El usuario la tiene que cambiar en su primer ingreso. */
  passwordTemporal: esquemaPasswordNueva,
});

export const esquemaEditarUsuario = z
  .object({
    nombre: esquemaNombre,
    rol: esquemaRol,
    activo: z.boolean(),
  })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'No hay cambios para guardar');

export const esquemaRestablecerPassword = z.object({
  passwordTemporal: esquemaPasswordNueva,
});

export const esquemaIdUsuario = z.object({
  id: z.uuid('Identificador inválido'),
});

export type DatosCrearUsuario = z.infer<typeof esquemaCrearUsuario>;
export type DatosEditarUsuario = z.infer<typeof esquemaEditarUsuario>;
export type DatosRestablecerPassword = z.infer<typeof esquemaRestablecerPassword>;
