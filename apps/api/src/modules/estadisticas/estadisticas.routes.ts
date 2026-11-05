import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { estadisticasController } from './estadisticas.controller';

export const estadisticasRoutes = Router();

estadisticasRoutes.get('/', requierePermiso('estadisticas.ver'), estadisticasController.obtener);
