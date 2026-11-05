import { tienePermiso, type Permiso, type Usuario } from '@stock/shared';
import type { Request, RequestHandler } from 'express';
import { borrarCookieDeSesion, guardarCookieDeSesion, leerTokenDeSesion } from '../modules/auth/cookies';
import { authService } from '../modules/auth/auth.service';
import { AppError, errores } from '../shared/errors/AppError';

interface OpcionesSesion {
  /**
   * Permite pasar aunque el usuario tenga que cambiar la contraseña.
   * Solo para las rutas de sesión: ver la sesión, cambiar la contraseña y salir.
   */
  permitirPasswordPendiente?: boolean;
}

/** Exige una sesión válida. Completa `req.usuario` y `req.sesionId`. */
export function requiereSesion(opciones: OpcionesSesion = {}): RequestHandler {
  return async (req, res, next) => {
    const token = leerTokenDeSesion(req);
    if (!token) throw errores.noAutorizado();

    const sesion = await authService.validarSesion(token);
    if (!sesion) {
      borrarCookieDeSesion(res);
      throw errores.noAutorizado('Tu sesión expiró. Volvé a ingresar.');
    }

    if (sesion.renovadaHasta) guardarCookieDeSesion(res, token, sesion.renovadaHasta);

    req.usuario = sesion.usuario;
    req.sesionId = sesion.sesionId;

    if (sesion.usuario.debeCambiarPassword && !opciones.permitirPasswordPendiente) {
      throw new AppError(403, 'DEBE_CAMBIAR_PASSWORD', 'Tenés que cambiar tu contraseña antes de continuar.');
    }

    next();
  };
}

/** Exige que el rol del usuario tenga el permiso. Usar siempre después de `requiereSesion`. */
export function requierePermiso(permiso: Permiso): RequestHandler {
  return (req, _res, next) => {
    const usuario = usuarioActual(req);
    if (!tienePermiso(usuario.rol, permiso)) throw errores.prohibido();
    next();
  };
}

/** Usuario autenticado del pedido. Lanza 401 si la ruta no pasó por `requiereSesion`. */
export function usuarioActual(req: Request): Usuario {
  if (!req.usuario) throw errores.noAutorizado();
  return req.usuario;
}
