import {
  esquemaCodigoParam,
  esquemaCrearProducto,
  esquemaEditarProducto,
  esquemaFiltrosProductos,
  esquemaId,
} from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { productosService } from './productos.service';

export const productosController = {
  async listar(req: Request, res: Response) {
    const filtros = esquemaFiltrosProductos.parse(req.query);
    responder(res, await productosService.listar(filtros, usuarioActual(req)));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    responder(res, await productosService.obtener(id, usuarioActual(req)));
  },

  async buscarPorCodigo(req: Request, res: Response) {
    const { codigo } = esquemaCodigoParam.parse(req.params);
    responder(res, await productosService.buscarPorCodigo(codigo, usuarioActual(req)));
  },

  async crear(req: Request, res: Response) {
    const datos = esquemaCrearProducto.parse(req.body);
    responder(res, await productosService.crear(datos, usuarioActual(req)), 201);
  },

  async editar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const cambios = esquemaEditarProducto.parse(req.body);
    responder(res, await productosService.editar(id, cambios, usuarioActual(req)));
  },
};
