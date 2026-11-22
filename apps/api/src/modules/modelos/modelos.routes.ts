import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { modelosController } from './modelos.controller';

const gestionar = requierePermiso('productos.gestionar');

/**
 * Modelos con talles y colores (funcionalidad "variantes").
 * Consultar: cualquier usuario con sesión. Crear y editar: solo con permiso.
 */
export const modelosRoutes = Router();

modelosRoutes.get('/', modelosController.listar);
modelosRoutes.get('/:id', modelosController.obtener);
modelosRoutes.post('/', gestionar, modelosController.crear);
modelosRoutes.patch('/:id', gestionar, modelosController.editar);
modelosRoutes.post('/:id/combinaciones', gestionar, modelosController.agregarCombinaciones);
