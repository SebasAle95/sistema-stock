import { z } from 'zod';
import { esquemaCantidad, esquemaDinero, esquemaPaginacion } from './comunes';

/** Código de barras (EAN/UPC) o código interno. */
export const esquemaCodigoBarras = z
  .string()
  .trim()
  .max(64, 'Puede tener hasta 64 caracteres')
  .regex(/^[0-9A-Za-z._-]*$/, 'Solo números, letras, punto, guion y guion bajo');

/** Código opcional: vacío o null se guarda como "sin código". */
const esquemaCodigoOpcional = esquemaCodigoBarras.nullable().transform((valor) => (valor ? valor : null));

const esquemaNombreProducto = z
  .string()
  .trim()
  .min(2, 'Tiene que tener al menos 2 caracteres')
  .max(120, 'Puede tener hasta 120 caracteres');

const esquemaPrecioVenta = esquemaDinero('Ingresá el precio de venta').refine(
  (valor) => valor > 0,
  'Tiene que ser mayor a 0',
);

const camposProducto = {
  nombre: esquemaNombreProducto,
  codigoBarras: esquemaCodigoOpcional,
  categoriaId: z.uuid('Categoría inválida').nullable(),
  precioVenta: esquemaPrecioVenta,
  /** Lo carga y lo ve solo quien tiene el permiso `productos.ver_costos`. */
  precioCosto: esquemaDinero('Costo inválido').nullable(),
  stockMinimo: esquemaCantidad('Ingresá el stock mínimo'),
  /** false para lo que se prepara en el momento (café, sándwich): no lleva stock. */
  controlaStock: z.boolean(),
  /** Aparece como botón en la pantalla de venta (útil para productos sin código). */
  accesoRapido: z.boolean(),
};

export const esquemaCrearProducto = z.object({
  ...camposProducto,
  codigoBarras: camposProducto.codigoBarras.default(null),
  categoriaId: camposProducto.categoriaId.default(null),
  precioCosto: camposProducto.precioCosto.default(null),
  stockMinimo: camposProducto.stockMinimo.default(0),
  controlaStock: camposProducto.controlaStock.default(true),
  accesoRapido: camposProducto.accesoRapido.default(false),
  /** Unidades con las que arranca. Queda registrado como movimiento de stock "inicial". */
  stockInicial: esquemaCantidad('Ingresá el stock inicial').default(0),
});

/** El stock no se edita acá: cambia solo con movimientos (ingresos, ventas, ajustes). */
export const esquemaEditarProducto = z
  .object({ ...camposProducto, activo: z.boolean() })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'No hay cambios para guardar');

export const ESTADOS_FILTRO_PRODUCTOS = ['activos', 'inactivos', 'todos'] as const;

export const esquemaFiltrosProductos = esquemaPaginacion.extend({
  /** Busca por nombre (sin importar acentos ni mayúsculas) o por el comienzo del código. */
  buscar: z.string().trim().max(100).optional(),
  /** Id de categoría, o "sin" para los productos sin categoría. */
  categoriaId: z.union([z.uuid(), z.literal('sin')]).optional(),
  estado: z.enum(ESTADOS_FILTRO_PRODUCTOS).default('activos'),
  /** Solo productos con stock igual o menor al mínimo. */
  stockBajo: z.stringbool().default(false),
  /** Solo productos marcados como botón rápido. */
  accesoRapido: z.stringbool().default(false),
});

export const esquemaCodigoParam = z.object({
  codigo: esquemaCodigoBarras.min(1, 'Código vacío'),
});

export type DatosCrearProducto = z.infer<typeof esquemaCrearProducto>;
export type DatosEditarProducto = z.infer<typeof esquemaEditarProducto>;
export type FiltrosProductos = z.infer<typeof esquemaFiltrosProductos>;
export type EstadoFiltroProductos = (typeof ESTADOS_FILTRO_PRODUCTOS)[number];
