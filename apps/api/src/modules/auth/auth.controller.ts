import { esquemaCambiarPassword, esquemaLogin } from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { errores } from '../../shared/errors/AppError';
import { responder } from '../../utils/responder';
import { authService } from './auth.service';
import { borrarCookieDeSesion, guardarCookieDeSesion, leerTokenDeSesion } from './cookies';

export const authController = {
  async iniciarSesion(req: Request, res: Response) {
    const datos = esquemaLogin.parse(req.body);
    const { token, expiraEn, usuario } = await authService.iniciarSesion(datos, {
      ip: req.ip,
      agenteDeUsuario: req.get('user-agent'),
    });
    guardarCookieDeSesion(res, token, expiraEn);
    responder(res, usuario);
  },

  /** Funciona aunque la sesión ya haya vencido: siempre borra la cookie. */
  async cerrarSesion(req: Request, res: Response) {
    const token = leerTokenDeSesion(req);
    if (token) await authService.cerrarSesion(token);
    borrarCookieDeSesion(res);
    responder(res, null);
  },

  obtenerSesion(req: Request, res: Response) {
    responder(res, usuarioActual(req));
  },

  async cambiarPassword(req: Request, res: Response) {
    const datos = esquemaCambiarPassword.parse(req.body);
    const usuario = usuarioActual(req);
    if (!req.sesionId) throw errores.noAutorizado();
    responder(res, await authService.cambiarPassword(usuario.id, req.sesionId, datos));
  },
};
