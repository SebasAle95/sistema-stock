import { Router } from 'express';
import { healthRoutes } from './modules/health/health.routes';

/** Registro central de módulos. Cada módulo nuevo se suma con una línea. */
export const rutas = Router();

rutas.use('/health', healthRoutes);
