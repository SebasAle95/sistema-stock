import { z } from 'zod';

/** Primer mensaje de error de cada campo de un formulario: { usuario: 'Ingresá tu usuario' }. */
export type ErroresDeCampos = Partial<Record<string, string>>;

/** Convierte un error de Zod en mensajes por campo, listos para mostrar debajo de cada input. */
export function erroresDeCampos(error: z.ZodError): ErroresDeCampos {
  const { fieldErrors } = z.flattenError(error) as { fieldErrors: Record<string, string[] | undefined> };
  const resultado: ErroresDeCampos = {};
  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    if (mensajes?.[0]) resultado[campo] = mensajes[0];
  }
  return resultado;
}

/** Igual que `erroresDeCampos`, pero a partir de los `detalles` de un error de la API. */
export function erroresDeCamposDeApi(detalles: unknown): ErroresDeCampos {
  if (typeof detalles !== 'object' || detalles === null || !('fieldErrors' in detalles)) return {};
  const { fieldErrors } = detalles;
  if (typeof fieldErrors !== 'object' || fieldErrors === null) return {};

  const resultado: ErroresDeCampos = {};
  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    if (Array.isArray(mensajes) && typeof mensajes[0] === 'string') resultado[campo] = mensajes[0];
  }
  return resultado;
}
