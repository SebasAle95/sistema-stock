import { esquemaCategoria, esquemaId } from '@stock/shared';
import type { Request, Response } from 'express';
import { responder } from '../../utils/responder';
import { categoriasService } from './categorias.service';

export const categoriasController = {
  async listar(_req: Request, res: Response) {
    responder(res, await categoriasService.listar());
  },

  async crear(req: Request, res: Response) {
    const { nombre } = esquemaCategoria.parse(req.body);
    responder(res, await categoriasService.crear(nombre), 201);
  },

  async renombrar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { nombre } = esquemaCategoria.parse(req.body);
    await categoriasService.renombrar(id, nombre);
    responder(res, null);
  },

  async eliminar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    await categoriasService.eliminar(id);
    responder(res, null);
  },
};
