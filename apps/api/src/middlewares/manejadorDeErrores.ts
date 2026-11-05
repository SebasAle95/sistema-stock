import type { ErrorApi, RespuestaApi } from '@stock/shared';
import type { ErrorRequestHandler, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../shared/errors/AppError';

function enviarError(res: Response, status: number, error: ErrorApi): void {
  const cuerpo: RespuestaApi<never> = { ok: false, error };
  res.status(status).json(cuerpo);
}

/** JSON mal formado en el body (lo detecta express.json). */
function esJsonInvalido(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
}

/**
 * Último middleware: convierte cualquier error en una respuesta { ok: false, error }.
 * Express 5 manda acá también los errores de funciones async, sin try/catch.
 */
export const manejadorDeErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    enviarError(res, err.status, { codigo: err.codigo, mensaje: err.message, detalles: err.detalles });
    return;
  }

  if (err instanceof z.ZodError) {
    enviarError(res, 400, {
      codigo: 'VALIDACION',
      mensaje: 'Los datos enviados no son válidos',
      detalles: z.flattenError(err),
    });
    return;
  }

  if (esJsonInvalido(err)) {
    enviarError(res, 400, { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la solicitud no es un JSON válido' });
    return;
  }

  console.error(err);
  enviarError(res, 500, { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' });
};
