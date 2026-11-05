import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { usuariosController } from './usuarios.controller';

/** Gestión de usuarios: solo para quien tenga el permiso (por defecto, el administrador). */
export const usuariosRoutes = Router();

usuariosRoutes.use(requierePermiso('usuarios.gestionar'));

usuariosRoutes.get('/', usuariosController.listar);
usuariosRoutes.post('/', usuariosController.crear);
usuariosRoutes.patch('/:id', usuariosController.editar);
usuariosRoutes.post('/:id/restablecer-password', usuariosController.restablecerPassword);
