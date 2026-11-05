import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { ventasController } from './ventas.controller';

const registrar = requierePermiso('ventas.registrar');

export const ventasRoutes = Router();

ventasRoutes.post('/', registrar, ventasController.registrar);
ventasRoutes.get('/', registrar, ventasController.listar);
ventasRoutes.get('/:id', registrar, ventasController.obtener);
ventasRoutes.post('/:id/anular', requierePermiso('ventas.anular'), ventasController.anular);
