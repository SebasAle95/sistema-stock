import { z } from 'zod';

/** Parámetro `:id` de las rutas. */
export const esquemaId = z.object({
  id: z.uuid('Identificador inválido'),
});

/** Página de resultados: `?pagina=1&porPagina=25`. */
export const esquemaPaginacion = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(25),
});

const MAX_DINERO = 99_999_999.99;

/** Importe en pesos: no negativo y redondeado a 2 decimales. */
export const esquemaDinero = (mensajeRequerido: string) =>
  z
    .number({ error: mensajeRequerido })
    .min(0, 'No puede ser negativo')
    .max(MAX_DINERO, 'Es demasiado alto')
    .transform((valor) => Math.round(valor * 100) / 100);

/** Cantidad entera no negativa (unidades de stock). */
export const esquemaCantidad = (mensajeRequerido: string) =>
  z
    .number({ error: mensajeRequerido })
    .int('Tiene que ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(1_000_000, 'Es demasiado alto');
