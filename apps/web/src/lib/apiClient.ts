import type { RespuestaApi } from '@stock/shared';

/**
 * Los pedidos van a /api de la misma web, que los reenvía a la API (ver next.config.ts).
 * Así la cookie de sesión viaja sola. Este cliente es para componentes de cliente ('use client').
 */
const URL_BASE = '/api';

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

/**
 * Si la sesión venció o hay que cambiar la contraseña, se lleva al usuario a la
 * pantalla que corresponde. Las rutas /auth/* manejan esos casos por su cuenta.
 * Este módulo no es un componente (no tiene router), y una recarga completa
 * además descarta los datos que hubiera en memoria.
 */
function redirigirSiCorresponde(ruta: string, status: number, codigo: string): void {
  if (typeof window === 'undefined' || ruta.startsWith('/auth/')) return;

  if (status === 401) {
    const siguiente = encodeURIComponent(window.location.pathname + window.location.search);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?expirada=1&siguiente=${siguiente}`);
  } else if (codigo === 'DEBE_CAMBIAR_PASSWORD') {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/cambiar-password');
  }
}

async function solicitar<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const tieneCuerpo = cuerpo !== undefined;
  let respuesta: Response;

  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
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
    redirigirSiCorresponde(ruta, respuesta.status, json.error.codigo);
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

/** Mensaje para mostrarle al usuario a partir de cualquier error. */
export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorDeApi ? error.message : 'Ocurrió un error inesperado. Probá de nuevo.';
}
