import { z } from 'zod';

/** bcrypt solo usa los primeros 72 bytes: más largo no suma seguridad y se rechaza. */
export const MAX_BYTES_PASSWORD = 72;

export function bytesDeTexto(texto: string): number {
  return new TextEncoder().encode(texto).length;
}

/** Reglas para cualquier contraseña nueva (creación, cambio o restablecimiento). */
export const esquemaPasswordNueva = z
  .string()
  .min(8, 'Tiene que tener al menos 8 caracteres')
  .refine((valor) => bytesDeTexto(valor) <= MAX_BYTES_PASSWORD, 'Es demasiado larga (máximo 72 caracteres)')
  .regex(/\p{L}/u, 'Tiene que tener al menos una letra')
  .regex(/\d/, 'Tiene que tener al menos un número');

export const esquemaNombreUsuario = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Tiene que tener al menos 3 caracteres')
  .max(30, 'Puede tener hasta 30 caracteres')
  .regex(/^[a-z0-9._-]+$/, 'Solo letras sin acentos, números, punto, guion y guion bajo');

export const esquemaLogin = z.object({
  usuario: z.string().trim().toLowerCase().min(1, 'Ingresá tu usuario').max(30, 'Usuario inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña').max(200, 'Contraseña inválida'),
});

export const esquemaCambiarPassword = z
  .object({
    passwordActual: z.string().min(1, 'Ingresá tu contraseña actual').max(200),
    passwordNueva: esquemaPasswordNueva,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.passwordNueva === datos.confirmacion, {
    path: ['confirmacion'],
    message: 'Las contraseñas no coinciden',
  })
  .refine((datos) => datos.passwordNueva !== datos.passwordActual, {
    path: ['passwordNueva'],
    message: 'Tiene que ser distinta de la actual',
  });

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosCambiarPassword = z.infer<typeof esquemaCambiarPassword>;
