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

/** Fecha "AAAA-MM-DD" (como la devuelve un input de tipo fecha). */
export const esquemaFecha = z.iso.date('Fecha inválida');

/** Filtro por rango de días (inclusive), en la zona horaria del negocio. */
export const esquemaRangoFechas = z.object({
  desde: esquemaFecha.optional(),
  hasta: esquemaFecha.optional(),
});

/** Texto obligatorio corto: motivos, notas. */
export const esquemaMotivo = (mensajeRequerido: string) =>
  z
    .string({ error: mensajeRequerido })
    .trim()
    .min(3, mensajeRequerido)
    .max(200, 'Puede tener hasta 200 caracteres');

/** Cantidad entera no negativa (unidades de stock). */
export const esquemaCantidad = (mensajeRequerido: string) =>
  z
    .number({ error: mensajeRequerido })
    .int('Tiene que ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(1_000_000, 'Es demasiado alto');
