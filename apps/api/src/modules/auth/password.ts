import { bytesDeTexto, MAX_BYTES_PASSWORD } from '@stock/shared';
import bcrypt from 'bcrypt';
import { env } from '../../config/env';

/**
 * Hash de contraseñas con bcrypt.
 * - Agrega un "salt" aleatorio por contraseña: dos usuarios con la misma clave tienen hashes distintos.
 * - Es lento a propósito (costo configurable): adivinar por fuerza bruta se vuelve impracticable.
 * Nunca usar MD5/SHA para contraseñas: son rápidos y están pensados para otra cosa.
 */
export function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_COSTO);
}

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  // Nunca se guardan contraseñas de más de 72 bytes, así que una más larga no puede coincidir.
  if (bytesDeTexto(password) > MAX_BYTES_PASSWORD) return false;
  return bcrypt.compare(password, hash);
}

/** true si el hash se hizo con un costo menor al configurado (se re-hashea en el próximo ingreso). */
export function necesitaRehash(hash: string): boolean {
  return bcrypt.getRounds(hash) < env.BCRYPT_COSTO;
}

let hashDeRelleno: Promise<string> | undefined;

/**
 * Hace el mismo trabajo que una verificación real cuando el usuario no existe.
 * Así el tiempo de respuesta no revela qué nombres de usuario existen.
 */
export async function simularVerificacion(password: string): Promise<void> {
  hashDeRelleno ??= bcrypt.hash('usuario-inexistente', env.BCRYPT_COSTO);
  await verificarPassword(password, await hashDeRelleno);
}
