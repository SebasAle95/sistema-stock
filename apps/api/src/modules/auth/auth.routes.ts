import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requiereSesion } from '../../middlewares/autenticacion';
import { AppError } from '../../shared/errors/AppError';
import { authController } from './auth.controller';

/**
 * Límite por IP para el login: 20 intentos fallidos cada 15 minutos (los exitosos no cuentan).
 * Se suma al bloqueo por cuenta (5 intentos) que hace el service.
 */
const limiteDeLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos de ingreso. Esperá unos minutos y probá de nuevo.'));
  },
});

const sesionConPasswordPendiente = requiereSesion({ permitirPasswordPendiente: true });

export const authRoutes = Router();

authRoutes.post('/login', limiteDeLogin, authController.iniciarSesion);
authRoutes.post('/logout', authController.cerrarSesion);
authRoutes.get('/sesion', sesionConPasswordPendiente, authController.obtenerSesion);
authRoutes.post('/cambiar-password', sesionConPasswordPendiente, authController.cambiarPassword);
