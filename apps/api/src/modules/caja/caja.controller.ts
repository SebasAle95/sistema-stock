import {
  esquemaAbrirCaja,
  esquemaCerrarCaja,
  esquemaFiltrosCajas,
  esquemaId,
  esquemaMovimientoCaja,
  tienePermiso,
} from '@stock/shared';
import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/autenticacion';
import { errores } from '../../shared/errors/AppError';
import { responder } from '../../utils/responder';
import { cajaService } from './caja.service';

export const cajaController = {
  async actual(req: Request, res: Response) {
    responder(res, await cajaService.actual(usuarioActual(req)));
  },

  async abrir(req: Request, res: Response) {
    const { montoInicial } = esquemaAbrirCaja.parse(req.body);
    responder(res, await cajaService.abrir(montoInicial, usuarioActual(req)), 201);
  },

  async registrarMovimiento(req: Request, res: Response) {
    const datos = esquemaMovimientoCaja.parse(req.body);
    await cajaService.registrarMovimiento(datos, usuarioActual(req));
    responder(res, null, 201);
  },

  /** Movimientos de la caja abierta, o de otra caja (`?cajaId=`) si puede ver totales. */
  async listarMovimientos(req: Request, res: Response) {
    const cajaId = typeof req.query.cajaId === 'string' ? esquemaId.parse({ id: req.query.cajaId }).id : null;
    if (cajaId && !tienePermiso(usuarioActual(req).rol, 'caja.ver_totales')) throw errores.prohibido();
    responder(res, await cajaService.listarMovimientos(cajaId));
  },

  async cerrar(req: Request, res: Response) {
    const datos = esquemaCerrarCaja.parse(req.body);
    responder(res, await cajaService.cerrar(datos, usuarioActual(req)));
  },

  async historial(req: Request, res: Response) {
    const filtros = esquemaFiltrosCajas.parse(req.query);
    responder(res, await cajaService.historial(filtros, usuarioActual(req)));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    responder(res, await cajaService.obtener(id, usuarioActual(req)));
  },
};
