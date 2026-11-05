/**
 * Error de negocio con status HTTP y código estable.
 * Se lanza desde services/repositories y el manejador de errores lo convierte
 * en una respuesta { ok: false, error }.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'AppError';
  }
}

/** Atajos para los errores más comunes. */
export const errores = {
  solicitudInvalida: (mensaje: string, detalles?: unknown) =>
    new AppError(400, 'SOLICITUD_INVALIDA', mensaje, detalles),
  noAutorizado: (mensaje = 'Tenés que iniciar sesión') => new AppError(401, 'NO_AUTORIZADO', mensaje),
  prohibido: (mensaje = 'No tenés permiso para hacer esto') => new AppError(403, 'PROHIBIDO', mensaje),
  noEncontrado: (mensaje = 'No se encontró el recurso') => new AppError(404, 'NO_ENCONTRADO', mensaje),
  conflicto: (mensaje: string) => new AppError(409, 'CONFLICTO', mensaje),
  servicioNoDisponible: (mensaje: string) => new AppError(503, 'SERVICIO_NO_DISPONIBLE', mensaje),
};
