import { Router } from 'express';
import { requierePermiso } from '../../middlewares/autenticacion';
import { etiquetasController } from './etiquetas.controller';

/**
 * Etiquetas con código de barras (funcionalidad "etiquetas"). Las etiquetas se arman
 * e imprimen en el navegador; la API solo asigna códigos internos a lo que no tiene.
 */
export const etiquetasRoutes = Router();

etiquetasRoutes.post('/codigos', requierePermiso('productos.gestionar'), etiquetasController.generarCodigos);
