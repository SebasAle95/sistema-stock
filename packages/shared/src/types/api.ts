/**
 * Formato único de respuesta de la API.
 * Toda respuesta trae `ok`: si es true viene `data`, si es false viene `error`.
 */

export interface ErrorApi {
  /** Código estable para manejar el error desde el código (ej: "NO_ENCONTRADO"). */
  codigo: string;
  /** Mensaje para mostrarle al usuario. */
  mensaje: string;
  /** Información extra, por ejemplo los campos que no pasaron la validación. */
  detalles?: unknown;
}

export type RespuestaApi<T> = { ok: true; data: T } | { ok: false; error: ErrorApi };
