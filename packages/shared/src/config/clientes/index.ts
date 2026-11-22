import { bellaEsencia } from './bella-esencia';
import { laFrontera } from './la-frontera';

/**
 * Clientes del sistema. Para sumar uno: crear su archivo en esta carpeta, agregarlo
 * acá y poner su logo en apps/web/public/clientes/<id>/ (ver docs/clientes.md).
 */
export const clientes = {
  'la-frontera': laFrontera,
  'bella-esencia': bellaEsencia,
} as const;

export type IdCliente = keyof typeof clientes;

/** El que se usa si no se indica CLIENTE: así el despliegue de La Frontera sigue igual que siempre. */
export const CLIENTE_POR_DEFECTO: IdCliente = 'la-frontera';
