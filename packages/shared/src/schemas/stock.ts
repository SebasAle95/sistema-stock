import { z } from 'zod';
import { TIPOS_MOVIMIENTO_STOCK } from '../types/productos';
import { esquemaCantidad, esquemaDinero, esquemaPaginacion, esquemaRangoFechas } from './comunes';

const esquemaCantidadPositiva = esquemaCantidad('Ingresá la cantidad').refine((n) => n > 0, 'Tiene que ser al menos 1');
const esquemaNota = z.string().trim().max(200, 'Puede tener hasta 200 caracteres');

/** Ingreso de mercadería: varios productos a la vez (lo que trajo el proveedor). */
export const esquemaIngresoStock = z
  .object({
    items: z
      .array(
        z.object({
          productoId: z.uuid('Producto inválido'),
          cantidad: esquemaCantidadPositiva,
          /** Costo por unidad de esta compra. Solo se tiene en cuenta si el usuario puede ver costos. */
          costoUnitario: esquemaDinero('Costo inválido').nullable().default(null),
        }),
      )
      .min(1, 'Agregá al menos un producto')
      .max(200, 'Son demasiados productos para un solo ingreso'),
    /** Por ejemplo: proveedor o número de remito. */
    nota: esquemaNota.optional(),
    /** Si se carga costo, actualizar también el precio de costo del producto. */
    actualizarCosto: z.boolean().default(true),
  })
  .refine((datos) => new Set(datos.items.map((i) => i.productoId)).size === datos.items.length, {
    message: 'Hay productos repetidos',
    path: ['items'],
  });

export const MOTIVOS_MERMA = ['Vencido', 'Roto o dañado', 'Consumo interno', 'Otro'] as const;

/** Ajuste (se contó el stock real) o merma (se descartan unidades). */
export const esquemaAjusteStock = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('ajuste'),
    productoId: z.uuid('Producto inválido'),
    /** Unidades que hay realmente, contadas a mano. */
    stockReal: esquemaCantidad('Ingresá el stock que contaste'),
    nota: esquemaNota.optional(),
  }),
  z.object({
    tipo: z.literal('merma'),
    productoId: z.uuid('Producto inválido'),
    cantidad: esquemaCantidadPositiva,
    nota: z
      .string({ error: 'Indicá el motivo' })
      .trim()
      .min(3, 'Indicá el motivo')
      .max(200, 'Puede tener hasta 200 caracteres'),
  }),
]);

export const esquemaFiltrosMovimientos = esquemaPaginacion.extend(esquemaRangoFechas.shape).extend({
  /** Busca por nombre del producto. */
  buscar: z.string().trim().max(100).optional(),
  tipo: z.enum(TIPOS_MOVIMIENTO_STOCK).optional(),
});

export type DatosIngresoStock = z.infer<typeof esquemaIngresoStock>;
export type DatosAjusteStock = z.infer<typeof esquemaAjusteStock>;
export type FiltrosMovimientos = z.infer<typeof esquemaFiltrosMovimientos>;
