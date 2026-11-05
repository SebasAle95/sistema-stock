import type { RequestHandler } from 'express';
import { errores } from '../shared/errors/AppError';

export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(errores.noEncontrado(`No existe la ruta ${req.method} ${req.originalUrl}`));
};
