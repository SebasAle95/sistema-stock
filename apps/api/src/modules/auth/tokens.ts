import { createHash, randomBytes } from 'node:crypto';

/**
 * Token de sesión: 32 bytes aleatorios criptográficamente seguros (256 bits).
 * El token viaja solo en la cookie; en la base se guarda su SHA-256.
 * (SHA-256 sí es correcto acá: el token es aleatorio, no una contraseña elegida por una persona.)
 */
export function generarTokenDeSesion() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashearToken(token) };
}

export function hashearToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
