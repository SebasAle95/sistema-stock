import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const CLIENTE_POR_DEFECTO = 'la-frontera';

function leer(archivo: string): Record<string, string> | null {
  return fs.existsSync(archivo) ? dotenv.parse(fs.readFileSync(archivo)) : null;
}

/**
 * Carga los .env de la carpeta de la API, con esta prioridad:
 *   1. Lo que ya está definido (terminal, Docker): nunca se pisa.
 *   2. `.env.<cliente>`: lo de cada cliente, sobre todo la DATABASE_URL de su base.
 *   3. `.env`: lo común.
 *
 * El cliente sale de CLIENTE (terminal o .env) y, si no hay, es la-frontera.
 * Así `npm run bella` usa la base de Bella y `npm run frontera` la de La Frontera sin editar archivos.
 * En producción no hay archivos: todo llega por las variables del contenedor.
 */
export function cargarEnv(carpeta = process.cwd()): void {
  const comun = leer(path.join(carpeta, '.env')) ?? {};

  // Algunas herramientas (drizzle-kit) cargan el .env por su cuenta antes de llegar acá.
  // Un valor igual al del .env común cuenta como "del .env", no como "puesto en la terminal".
  const delEntorno = (clave: string): string | undefined => {
    const valor = process.env[clave];
    return valor !== undefined && valor !== comun[clave] ? valor : undefined;
  };

  const cliente = delEntorno('CLIENTE') || comun.CLIENTE || CLIENTE_POR_DEFECTO;
  const propio = leer(path.join(carpeta, `.env.${cliente}`)) ?? {};

  // Nunca usar la base de un cliente con otro: si la única base disponible es la del .env
  // común y ese .env es de otro cliente, es preferible no arrancar.
  const clienteDelComun = comun.CLIENTE || CLIENTE_POR_DEFECTO;
  if (!delEntorno('DATABASE_URL') && !propio.DATABASE_URL && comun.DATABASE_URL && clienteDelComun !== cliente) {
    throw new Error(
      `CLIENTE=${cliente}, pero la DATABASE_URL de apps/api/.env es la de ${clienteDelComun}. ` +
        `Poné la base de ${cliente} en apps/api/.env.${cliente} (ver docs/clientes.md).`,
    );
  }

  for (const [clave, valor] of Object.entries({ ...comun, ...propio, CLIENTE: cliente })) {
    if (delEntorno(clave) === undefined) process.env[clave] = valor;
  }
}
