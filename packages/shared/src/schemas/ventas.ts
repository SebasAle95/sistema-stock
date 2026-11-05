import { z } from 'zod';
import { negocio } from '../config/negocio';
import { esquemaCantidad, esquemaDinero, esquemaMotivo, esquemaPaginacion, esquemaRangoFechas } from './comunes';

/** Uno de los medios de pago configurados en `negocio.mediosDePago`. */
export const esquemaMedioDePago = z
  .string({ error: 'Elegí un medio de pago' })
  .refine((id) => negocio.mediosDePago.some((m) => m.id === id), 'Elegí un medio de pago válido');

export const MEDIO_EFECTIVO = 'efectivo';

/** "mercado_pago" → "Mercado Pago" */
export function nombreMedioDePago(id: string): string {
  return negocio.mediosDePago.find((m) => m.id === id)?.nombre ?? id;
}

/** Los precios no se mandan: los pone el servidor con los de la base. */
export const esquemaNuevaVenta = z
  .object({
    items: z
      .array(
        z.object({
          productoId: z.uuid('Producto inválido'),
          cantidad: esquemaCantidad('Ingresá la cantidad').refine((n) => n > 0, 'Tiene que ser al menos 1'),
        }),
      )
      .min(1, 'El carrito está vacío')
      .max(100, 'Son demasiados productos para una venta'),
    medioPago: esquemaMedioDePago,
    /** Con cuánto pagó el cliente (solo efectivo), para calcular el vuelto. */
    montoRecibido: esquemaDinero('Monto inválido').nullable().default(null),
  })
  .refine((datos) => new Set(datos.items.map((i) => i.productoId)).size === datos.items.length, {
    message: 'Hay productos repetidos',
    path: ['items'],
  });

export const esquemaAnularVenta = z.object({
  motivo: esquemaMotivo('Indicá por qué se anula'),
});

export const esquemaFiltrosVentas = esquemaPaginacion.extend(esquemaRangoFechas.shape).extend({
  cajaId: z.uuid().optional(),
});

export const esquemaAbrirCaja = z.object({
  /** Efectivo con el que arranca la caja (cambio). */
  montoInicial: esquemaDinero('Ingresá el efectivo inicial'),
});

export const TIPOS_MOVIMIENTO_CAJA = ['ingreso', 'egreso'] as const;
export type TipoMovimientoCaja = (typeof TIPOS_MOVIMIENTO_CAJA)[number];

/** Entrada o salida de efectivo que no es una venta (pago a proveedor, cambio, retiro). */
export const esquemaMovimientoCaja = z.object({
  tipo: z.enum(TIPOS_MOVIMIENTO_CAJA),
  monto: esquemaDinero('Ingresá el monto').refine((n) => n > 0, 'Tiene que ser mayor a 0'),
  motivo: esquemaMotivo('Indicá el motivo'),
});

export const esquemaCerrarCaja = z.object({
  /** Efectivo contado a mano al cerrar. */
  efectivoContado: esquemaDinero('Ingresá el efectivo que contaste'),
  nota: z.string().trim().max(200, 'Puede tener hasta 200 caracteres').optional(),
});

export const esquemaFiltrosCajas = esquemaPaginacion.extend(esquemaRangoFechas.shape);

export type DatosNuevaVenta = z.infer<typeof esquemaNuevaVenta>;
export type FiltrosVentas = z.infer<typeof esquemaFiltrosVentas>;
export type DatosMovimientoCaja = z.infer<typeof esquemaMovimientoCaja>;
export type DatosCerrarCaja = z.infer<typeof esquemaCerrarCaja>;
export type FiltrosCajas = z.infer<typeof esquemaFiltrosCajas>;
