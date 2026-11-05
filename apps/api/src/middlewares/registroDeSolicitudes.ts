import type { RequestHandler } from 'express';

/** Muestra en consola cada solicitud: método, ruta, status y duración. */
export const registroDeSolicitudes: RequestHandler = (req, res, next) => {
  const inicio = performance.now();
  res.on('finish', () => {
    const ms = Math.round(performance.now() - inicio);
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
  });
  next();
};
