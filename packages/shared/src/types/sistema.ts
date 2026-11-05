export type EstadoBaseDeDatos = 'conectada' | 'sin_configurar' | 'error';

/** Respuesta de GET /api/health */
export interface EstadoSistema {
  estado: 'ok';
  version: string;
  entorno: string;
  baseDeDatos: EstadoBaseDeDatos;
  /** Fecha y hora del servidor en formato ISO. */
  hora: string;
}
