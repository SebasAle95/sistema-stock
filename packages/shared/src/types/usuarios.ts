import type { Rol } from '../auth/roles';

/** Usuario tal como lo devuelve la API. Nunca incluye el hash de la contraseña. */
export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
  activo: boolean;
  debeCambiarPassword: boolean;
  /** Fecha ISO del último ingreso, o null si nunca entró. */
  ultimoAcceso: string | null;
  creadoEn: string;
}
