import { esquemaGenerarCodigos } from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { etiquetasService } from './etiquetas.service';

export const etiquetasController = {
  async generarCodigos(req: Request, res: Response) {
    const { productoIds } = esquemaGenerarCodigos.parse(req.body);
    responder(res, await etiquetasService.generarCodigos(productoIds, usuarioActual(req)));
  },
};
