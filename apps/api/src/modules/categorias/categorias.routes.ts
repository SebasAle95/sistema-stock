import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { categoriasController } from './categorias.controller';

const gestionar = requierePermiso('productos.gestionar');

export const categoriasRoutes = Router();

categoriasRoutes.get('/', categoriasController.listar);
categoriasRoutes.post('/', gestionar, categoriasController.crear);
categoriasRoutes.patch('/:id', gestionar, categoriasController.renombrar);
categoriasRoutes.delete('/:id', gestionar, categoriasController.eliminar);
