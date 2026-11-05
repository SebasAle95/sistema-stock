import { esquemaAjusteStock, esquemaFiltrosMovimientos, esquemaIngresoStock } from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { stockService } from './stock.service';

export const stockController = {
  async registrarIngreso(req: Request, res: Response) {
    const datos = esquemaIngresoStock.parse(req.body);
    responder(res, await stockService.registrarIngreso(datos, usuarioActual(req)), 201);
  },

  async ajustar(req: Request, res: Response) {
    const datos = esquemaAjusteStock.parse(req.body);
    responder(res, await stockService.ajustar(datos, usuarioActual(req)), 201);
  },

  async listarMovimientos(req: Request, res: Response) {
    const filtros = esquemaFiltrosMovimientos.parse(req.query);
    responder(res, await stockService.listarMovimientos(filtros, usuarioActual(req)));
  },
};
