/**
 * Nombre de la cookie de sesión. En producción usa el prefijo `__Host-`, que
 * obliga al navegador a aceptarla solo por HTTPS, sin dominio y en la ruta "/".
 */
export const COOKIE_SESION = {
  desarrollo: 'sesion',
  produccion: '__Host-sesion',
} as const;
