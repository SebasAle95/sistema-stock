import type { EstadoSistema } from '@stock/shared';
import { env } from '../../config/env';
import { verificarConexion } from '../../db/client';

/** Service: lógica de negocio. No conoce Express (ni req ni res). */
export const healthService = {
  async obtenerEstado(): Promise<EstadoSistema> {
    return {
      estado: 'ok',
      version: process.env.npm_package_version ?? '0.0.0',
      entorno: env.NODE_ENV,
      baseDeDatos: await verificarConexion(),
      hora: new Date().toISOString(),
    };
  },
};
