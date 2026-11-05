import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { cajaController } from './caja.controller';

const operar = requierePermiso('caja.operar');
const verTotales = requierePermiso('caja.ver_totales');

export const cajaRoutes = Router();

cajaRoutes.get('/actual', operar, cajaController.actual);
cajaRoutes.post('/abrir', operar, cajaController.abrir);
cajaRoutes.get('/movimientos', operar, cajaController.listarMovimientos);
cajaRoutes.post('/movimientos', operar, cajaController.registrarMovimiento);
cajaRoutes.post('/cerrar', operar, cajaController.cerrar);
cajaRoutes.get('/historial', verTotales, cajaController.historial);
cajaRoutes.get('/:id', verTotales, cajaController.obtener);
