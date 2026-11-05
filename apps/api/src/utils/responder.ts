import type { RespuestaApi } from '@stock/shared';
import type { Response } from 'express';

/** Envía una respuesta exitosa con el formato estándar { ok: true, data }. */
export function responder<T>(res: Response, data: T, status = 200): void {
  const cuerpo: RespuestaApi<T> = { ok: true, data };
  res.status(status).json(cuerpo);
}
