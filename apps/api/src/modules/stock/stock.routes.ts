import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { stockController } from './stock.controller';

export const stockRoutes = Router();

stockRoutes.post('/ingresos', requierePermiso('stock.ingresar'), stockController.registrarIngreso);
stockRoutes.post('/ajustes', requierePermiso('stock.ajustar'), stockController.ajustar);
stockRoutes.get('/movimientos', requierePermiso('stock.ver_historial'), stockController.listarMovimientos);
