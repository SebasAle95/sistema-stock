import type { RespuestaApi } from '@stock/shared';

const URL_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api';

/** Error que devuelve la API (o la falta de conexión con ella). */
export class ErrorDeApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorDeApi';
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function solicitar<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const tieneCuerpo = cuerpo !== undefined;
  let respuesta: Response;

  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      // Cuando sumemos el login, acá se agrega el header Authorization con el token de la sesión.
      headers: tieneCuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: tieneCuerpo ? JSON.stringify(cuerpo) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor');
  }

  let json: RespuestaApi<T>;
  try {
    json = (await respuesta.json()) as RespuestaApi<T>;
  } catch {
    throw new ErrorDeApi(respuesta.status, 'RESPUESTA_INVALIDA', 'El servidor devolvió una respuesta inesperada');
  }

  if (!json.ok) {
    throw new ErrorDeApi(respuesta.status, json.error.codigo, json.error.mensaje, json.error.detalles);
  }
  return json.data;
}

/**
 * Cliente HTTP único para hablar con la API. Siempre usar este, nunca fetch directo.
 *
 *   const productos = await api.get<Producto[]>('/productos');
 *   await api.post<Producto>('/productos', datos);
 */
export const api = {
  get: <T>(ruta: string) => solicitar<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PUT', ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PATCH', ruta, cuerpo),
  delete: <T>(ruta: string) => solicitar<T>('DELETE', ruta),
};
