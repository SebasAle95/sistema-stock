import type { TipoMovimientoCaja } from '../schemas/ventas';

interface Referencia {
  id: string;
  nombre: string;
}

export interface ItemVenta {
  productoId: string;
  /** Nombre del producto al momento de la venta. */
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  /** Número de ticket, correlativo. */
  numero: number;
  cajaId: string;
  usuario: Referencia;
  total: number;
  medioPago: string;
  montoRecibido: number | null;
  vuelto: number | null;
  anulada: boolean;
  motivoAnulacion: string | null;
  anuladaEn: string | null;
  creadoEn: string;
  items: ItemVenta[];
}

export interface MovimientoCaja {
  id: string;
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
  usuario: Referencia;
  creadoEn: string;
}

/** Totales de una caja. Solo lo ve quien tiene el permiso `caja.ver_totales`. */
export interface ResumenCaja {
  cantidadVentas: number;
  totalVentas: number;
  porMedioDePago: { medioPago: string; cantidad: number; total: number }[];
  ingresos: number;
  egresos: number;
  /** montoInicial + ventas en efectivo + ingresos − egresos */
  efectivoEsperado: number;
}

export interface Caja {
  id: string;
  numero: number;
  abiertaPor: Referencia;
  abiertaEn: string;
  montoInicial: number;
  cerradaPor: Referencia | null;
  cerradaEn: string | null;
  /** Cantidad de ventas (no anuladas). La ve cualquiera que opere la caja. */
  cantidadVentas: number;
  // Lo que sigue solo viene con el permiso `caja.ver_totales` (en el cierre ciego, el vendedor no lo ve).
  resumen?: ResumenCaja;
  efectivoContado?: number | null;
  diferencia?: number | null;
  notaCierre?: string | null;
}
