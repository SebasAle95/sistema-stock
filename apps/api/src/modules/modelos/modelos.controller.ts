import {
  esquemaAgregarCombinaciones,
  esquemaEditarModelo,
  esquemaFiltrosModelos,
  esquemaId,
  esquemaNuevoModelo,
} from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { modelosService } from './modelos.service';

export const modelosController = {
  async listar(req: Request, res: Response) {
    const filtros = esquemaFiltrosModelos.parse(req.query);
    responder(res, await modelosService.listar(filtros));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    responder(res, await modelosService.obtener(id, usuarioActual(req)));
  },

  async crear(req: Request, res: Response) {
    const datos = esquemaNuevoModelo.parse(req.body);
    responder(res, await modelosService.crear(datos, usuarioActual(req)), 201);
  },

  async editar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const cambios = esquemaEditarModelo.parse(req.body);
    responder(res, await modelosService.editar(id, cambios, usuarioActual(req)));
  },

  async agregarCombinaciones(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { combinaciones } = esquemaAgregarCombinaciones.parse(req.body);
    responder(res, await modelosService.agregarCombinaciones(id, combinaciones, usuarioActual(req)), 201);
  },
};
