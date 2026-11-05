import {
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  esquemaIdUsuario,
  esquemaRestablecerPassword,
} from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { responder } from '../../utils/responder';
import { usuariosService } from './usuarios.service';

export const usuariosController = {
  async listar(_req: Request, res: Response) {
    responder(res, await usuariosService.listar());
  },

  async crear(req: Request, res: Response) {
    const datos = esquemaCrearUsuario.parse(req.body);
    responder(res, await usuariosService.crear(datos), 201);
  },

  async editar(req: Request, res: Response) {
    const { id } = esquemaIdUsuario.parse(req.params);
    const cambios = esquemaEditarUsuario.parse(req.body);
    responder(res, await usuariosService.editar(id, cambios, usuarioActual(req)));
  },

  async restablecerPassword(req: Request, res: Response) {
    const { id } = esquemaIdUsuario.parse(req.params);
    const { passwordTemporal } = esquemaRestablecerPassword.parse(req.body);
    await usuariosService.restablecerPassword(id, passwordTemporal, usuarioActual(req));
    responder(res, null);
  },
};
