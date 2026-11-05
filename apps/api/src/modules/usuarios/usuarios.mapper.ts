import type { Usuario } from '@stock/shared';
import type { FilaUsuario } from '../../db/schema';

/** Convierte la fila de la base en el usuario que devuelve la API (sin hash ni datos internos). */
export function aUsuarioPublico(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    nombre: fila.nombre,
    usuario: fila.usuario,
    rol: fila.rol,
    activo: fila.activo,
    debeCambiarPassword: fila.debeCambiarPassword,
    ultimoAcceso: fila.ultimoAcceso?.toISOString() ?? null,
    creadoEn: fila.creadoEn.toISOString(),
  };
}
