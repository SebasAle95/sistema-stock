export interface TotalesPeriodo {
  /** Suma de las ventas no anuladas. */
  recaudacion: number;
  ventas: number;
  ticketPromedio: number;
  /** Ganancia de lo vendido con costo conocido: Σ (precio − costo) × cantidad. */
  ganancia: number;
  /** ganancia / recaudación de lo vendido con costo (0 a 1). */
  margen: number;
  /** Recaudación de productos sin costo cargado: su ganancia no se puede calcular. */
  recaudacionSinCosto: number;
}

export interface Estadisticas {
  desde: string;
  hasta: string;
  dias: number;
  actual: TotalesPeriodo;
  /** El período anterior de la misma cantidad de días, para comparar. */
  anterior: TotalesPeriodo;
  /** Un registro por día del rango (los días sin ventas vienen en 0). */
  porDia: { fecha: string; recaudacion: number; ventas: number }[];
  /** Las 24 horas del día, sumando todo el período (horarios pico). */
  porHora: { hora: number; recaudacion: number; ventas: number }[];
  /** Los 10 productos con más unidades vendidas. */
  topProductos: { productoId: string; nombre: string; unidades: number; recaudacion: number; ganancia: number | null }[];
  porMedioDePago: { medioPago: string; ventas: number; recaudacion: number }[];
}
