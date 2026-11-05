import { esquemaAnularVenta, esquemaFiltrosVentas, esquemaId, esquemaNuevaVenta } from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { ventasService } from './ventas.service';

export const ventasController = {
  async registrar(req: Request, res: Response) {
    const datos = esquemaNuevaVenta.parse(req.body);
    responder(res, await ventasService.registrar(datos, usuarioActual(req)), 201);
  },

  async listar(req: Request, res: Response) {
    const filtros = esquemaFiltrosVentas.parse(req.query);
    responder(res, await ventasService.listar(filtros, usuarioActual(req)));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    responder(res, await ventasService.obtener(id, usuarioActual(req)));
  },

  async anular(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { motivo } = esquemaAnularVenta.parse(req.body);
    responder(res, await ventasService.anular(id, motivo, usuarioActual(req)));
  },
};
