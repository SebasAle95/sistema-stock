import type { RequestHandler } from 'express';
import { origenesPermitidos } from '../config/env';
import { errores } from '../shared/errors/AppError';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protección extra contra CSRF: rechaza pedidos que modifican datos (POST, PUT,
 * PATCH, DELETE) si vienen de un sitio que no es el nuestro. Los navegadores
 * siempre mandan el header Origin en esos pedidos.
 */
export const verificarOrigen: RequestHandler = (req, _res, next) => {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const origen = req.get('origin');
  if (origen && !origenesPermitidos.includes(origen)) {
    return next(errores.prohibido('Origen no permitido'));
  }
  next();
};

/** Las respuestas de la API tienen datos privados: que ningún navegador ni proxy las guarde. */
export const sinCache: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
