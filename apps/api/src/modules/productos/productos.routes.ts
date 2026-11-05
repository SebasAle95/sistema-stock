import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { productosController } from './productos.controller';

const gestionar = requierePermiso('productos.gestionar');

/** Consultar: cualquier usuario con sesión. Crear y editar: solo con permiso. */
export const productosRoutes = Router();

productosRoutes.get('/', productosController.listar);
productosRoutes.get('/codigo/:codigo', productosController.buscarPorCodigo);
productosRoutes.get('/:id', productosController.obtener);
productosRoutes.post('/', gestionar, productosController.crear);
productosRoutes.patch('/:id', gestionar, productosController.editar);
