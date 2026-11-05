import { COOKIE_SESION } from '@stock/shared';
import type { CookieOptions, Request, Response } from 'express';
import { esProduccion } from '../../config/env';

export const NOMBRE_COOKIE_SESION = esProduccion ? COOKIE_SESION.produccion : COOKIE_SESION.desarrollo;

/**
 * - httpOnly: el JavaScript de la página no puede leerla (protege ante XSS).
 * - secure: en producción solo viaja por HTTPS.
 * - sameSite lax: el navegador no la manda en pedidos POST desde otros sitios (protege ante CSRF).
 */
const opciones: CookieOptions = {
  httpOnly: true,
  secure: esProduccion,
  sameSite: 'lax',
  path: '/',
};

export function leerTokenDeSesion(req: Request): string | undefined {
  const valor: unknown = req.cookies?.[NOMBRE_COOKIE_SESION];
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

export function guardarCookieDeSesion(res: Response, token: string, expiraEn: Date): void {
  res.cookie(NOMBRE_COOKIE_SESION, token, { ...opciones, expires: expiraEn });
}

export function borrarCookieDeSesion(res: Response): void {
  res.clearCookie(NOMBRE_COOKIE_SESION, opciones);
}
