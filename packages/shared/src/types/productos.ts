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
  /** Modelo al que pertenece esta combinación de talle y color (indumentaria). null en productos sueltos. */
  modelo: { id: string; nombre: string } | null;
  talle: string | null;
  color: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

/** Modelo con todas sus combinaciones de talle y color (funcionalidad "variantes"). */
export interface Modelo {
  id: string;
  nombre: string;
  categoria: { id: string; nombre: string } | null;
  /** Precio con que se crean sus combinaciones. Cambiarlo cambia el de todas. */
  precioVenta: number;
  /** Solo viene si el usuario tiene el permiso `productos.ver_costos`. */
  precioCosto?: number | null;
  stockMinimo: number;
  /** Talles y colores en el orden en que se muestran. */
  talles: string[];
  colores: string[];
  variantes: Producto[];
}

/** Un renglón del listado por modelo: cuenta solo las combinaciones activas. */
export interface ResumenModelo {
  id: string;
  nombre: string;
  categoria: { id: string; nombre: string } | null;
  precioVenta: number;
  talles: string[];
  colores: string[];
  combinaciones: number;
  /** Unidades sumando todas las combinaciones. */
  stock: number;
  /** Combinaciones con stock en el mínimo o por debajo. */
  combinacionesStockBajo: number;
}

/** Resultado de asignar códigos internos a productos que no tenían. */
export interface ResultadoCodigos {
  asignados: number;
  productos: Producto[];
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
