export interface Categoria {
  id: string;
  nombre: string;
  /** Productos (activos e inactivos) que tienen esta categoría. */
  cantidadProductos: number;
}

export interface Producto {
  id: string;
  nombre: string;
  codigoBarras: string | null;
  categoria: { id: string; nombre: string } | null;
  precioVenta: number;
  /** Solo viene si el usuario tiene el permiso `productos.ver_costos`. */
  precioCosto?: number | null;
  stock: number;
  stockMinimo: number;
  /** false para lo que se prepara en el momento: no lleva stock. */
  controlaStock: boolean;
  accesoRapido: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Resultado paginado de un listado. */
export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Tipos de movimiento de stock. La cantidad es positiva si entra y negativa si sale. */
export const TIPOS_MOVIMIENTO_STOCK = ['inicial', 'ingreso', 'ajuste', 'merma', 'venta', 'anulacion_venta'] as const;
export type TipoMovimientoStock = (typeof TIPOS_MOVIMIENTO_STOCK)[number];

export interface MovimientoStock {
  id: string;
  tipo: TipoMovimientoStock;
  /** Positiva si entró mercadería, negativa si salió. */
  cantidad: number;
  stockResultante: number;
  /** Solo viene si el usuario tiene el permiso `productos.ver_costos`. */
  costoUnitario?: number | null;
  nota: string | null;
  producto: { id: string; nombre: string };
  usuario: { id: string; nombre: string };
  creadoEn: string;
}

export interface ResultadoIngresoStock {
  productos: number;
  unidades: number;
}

export const nombresDeMovimientos: Record<TipoMovimientoStock, string> = {
  inicial: 'Stock inicial',
  ingreso: 'Ingreso de mercadería',
  ajuste: 'Ajuste de inventario',
  merma: 'Merma',
  venta: 'Venta',
  anulacion_venta: 'Venta anulada',
};
