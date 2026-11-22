/**
 * CONFIGURACIÓN DEL NEGOCIO (cliente activo)
 *
 * Un mismo código sirve a varios clientes. Cuál se usa lo decide la variable
 * CLIENTE al compilar y desplegar (por ejemplo CLIENTE=bella-esencia); sin ella,
 * es La Frontera. La configuración de cada uno está en ./clientes/.
 *
 * Lo leen el frontend (título, tema, logo, menú) y la API (fechas, medios de pago,
 * funcionalidades habilitadas).
 */
import { CLIENTE_POR_DEFECTO, clientes, type IdCliente } from './clientes';
import type { ConfigNegocio, Funcionalidad } from './tipos';

export * from './tipos';
export { CLIENTE_POR_DEFECTO, clientes, type IdCliente } from './clientes';

// La web reemplaza process.env.CLIENTE al compilar (next.config.ts) y la API también (tsup.config.ts).
const pedido = (typeof process !== 'undefined' ? process.env.CLIENTE : undefined) || CLIENTE_POR_DEFECTO;

function elegirCliente(id: string): ConfigNegocio {
  const config = (clientes as Record<string, ConfigNegocio>)[id];
  if (!config) {
    throw new Error(`CLIENTE="${id}" no existe. Opciones: ${Object.keys(clientes).join(', ')}`);
  }
  if (!config.mediosDePago.some((m) => m.id === 'efectivo')) {
    throw new Error(`La configuración de "${id}" tiene que incluir el medio de pago "efectivo".`);
  }
  return config;
}

export const negocio: ConfigNegocio = elegirCliente(pedido);

export const idCliente = negocio.id as IdCliente;

/** true si el cliente activo tiene prendida la funcionalidad. */
export function tieneFuncionalidad(funcionalidad: Funcionalidad): boolean {
  return negocio.funcionalidades.includes(funcionalidad);
}
