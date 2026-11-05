import type { Request, Response } from 'express';
import { responder } from '../../utils/responder';
import { healthService } from './health.service';

/**
 * Controller: recibe la solicitud, valida la entrada (con un esquema Zod:
 * `const datos = esquema.parse(req.body)`), llama al service y responde.
 */
export const healthController = {
  async obtener(_req: Request, res: Response) {
    responder(res, await healthService.obtenerEstado());
  },
};
