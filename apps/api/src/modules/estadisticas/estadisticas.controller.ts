import { esquemaFiltrosEstadisticas } from '@stock/shared';
import type { Request, Response } from 'express';
import { responder } from '../../utils/responder';
import { estadisticasService } from './estadisticas.service';

export const estadisticasController = {
  async obtener(req: Request, res: Response) {
    const filtros = esquemaFiltrosEstadisticas.parse(req.query);
    responder(res, await estadisticasService.obtener(filtros));
  },
};
