import { z } from 'zod';
import { esquemaCantidad, esquemaDinero, esquemaPaginacion } from './comunes';
import { ESTADOS_FILTRO_PRODUCTOS, esquemaCodigoOpcional } from './productos';

/**
 * Modelos con talles y colores (funcionalidad "variantes", indumentaria).
 * Cada combinación de talle y color es un producto con su propio stock y su código.
 */

export const TALLES_LETRAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const TALLES_NUMEROS = ['36', '38', '40', '42', '44', '46'] as const;
export const COLORES_SUGERIDOS = [
  'Negro',
  'Blanco',
  'Gris',
  'Beige',
  'Marrón',
  'Azul',
  'Celeste',
  'Verde',
  'Rosa',
  'Rojo',
  'Bordó',
  'Amarillo',
] as const;

const esquemaTalle = z.string().trim().min(1, 'Talle vacío').max(10, 'Talle demasiado largo').nullable();
const esquemaColor = z.string().trim().min(1, 'Color vacío').max(30, 'Color demasiado largo').nullable();

export const esquemaCombinacion = z
  .object({
    talle: esquemaTalle,
    color: esquemaColor,
    stockInicial: esquemaCantidad('Ingresá el stock').default(0),
    /** Si no se indica, se genera un código interno (EAN-13 que empieza con 21). */
    codigoBarras: esquemaCodigoOpcional.default(null),
  })
  .refine((c) => c.talle !== null || c.color !== null, 'Cada combinación necesita talle o color');

const clave = (c: { talle: string | null; color: string | null }) =>
  `${c.talle?.toLowerCase() ?? ''}|${c.color?.toLowerCase() ?? ''}`;

const esquemaCombinaciones = z
  .array(esquemaCombinacion)
  .min(1, 'Agregá al menos un talle o un color')
  .max(300, 'Son demasiadas combinaciones para un modelo')
  .refine((lista) => new Set(lista.map(clave)).size === lista.length, 'Hay combinaciones repetidas');

const esquemaNombreModelo = z
  .string()
  .trim()
  .min(2, 'Tiene que tener al menos 2 caracteres')
  .max(80, 'Puede tener hasta 80 caracteres');

const esquemaPrecioVenta = esquemaDinero('Ingresá el precio de venta').refine((v) => v > 0, 'Tiene que ser mayor a 0');

export const esquemaNuevoModelo = z.object({
  nombre: esquemaNombreModelo,
  categoriaId: z.uuid('Categoría inválida').nullable().default(null),
  precioVenta: esquemaPrecioVenta,
  precioCosto: esquemaDinero('Costo inválido').nullable().default(null),
  /** Stock mínimo de cada combinación (para la alerta de stock bajo). */
  stockMinimo: esquemaCantidad('Ingresá el stock mínimo').default(0),
  combinaciones: esquemaCombinaciones,
});

/** Cambios que se aplican a todas las combinaciones del modelo. */
export const esquemaEditarModelo = z
  .object({
    nombre: esquemaNombreModelo,
    categoriaId: z.uuid('Categoría inválida').nullable(),
    precioVenta: esquemaPrecioVenta,
    precioCosto: esquemaDinero('Costo inválido').nullable(),
    stockMinimo: esquemaCantidad('Ingresá el stock mínimo'),
  })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, 'No hay cambios para guardar');

/** Talles o colores nuevos para un modelo que ya existe (con el precio actual del modelo). */
export const esquemaAgregarCombinaciones = z.object({ combinaciones: esquemaCombinaciones });

export const esquemaGenerarCodigos = z.object({
  productoIds: z.array(z.uuid('Producto inválido')).min(1, 'Elegí al menos un producto').max(500),
});

/** Listado por modelo: `?buscar=remera&categoriaId=…&estado=activos&stockBajo=true`. */
export const esquemaFiltrosModelos = esquemaPaginacion.extend({
  buscar: z.string().trim().max(100).optional(),
  categoriaId: z.union([z.uuid(), z.literal('sin')]).optional(),
  estado: z.enum(ESTADOS_FILTRO_PRODUCTOS).default('activos'),
  /** Solo modelos con alguna combinación en el stock mínimo o por debajo. */
  stockBajo: z.stringbool().default(false),
});

export type FiltrosModelos = z.infer<typeof esquemaFiltrosModelos>;
export type DatosNuevoModelo = z.infer<typeof esquemaNuevoModelo>;
export type DatosEditarModelo = z.infer<typeof esquemaEditarModelo>;
export type DatosCombinacion = z.infer<typeof esquemaCombinacion>;

/** "Remera básica" + "Negro" + "M" → "Remera básica · Negro · M" */
export function nombreVariante(modelo: string, color: string | null, talle: string | null): string {
  return [modelo, color, talle].filter(Boolean).join(' · ');
}

const ORDEN_LETRAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** Ordena talles como se leen en una tienda: XS, S, M, L, XL… y los números de menor a mayor. */
export function ordenarTalles(talles: string[]): string[] {
  const peso = (t: string) => {
    const letra = ORDEN_LETRAS.indexOf(t.toUpperCase());
    if (letra >= 0) return [0, letra] as const;
    const numero = Number(t.replace(',', '.'));
    if (!Number.isNaN(numero)) return [1, numero] as const;
    return [2, 0] as const;
  };
  return [...talles].sort((a, b) => {
    const [ga, va] = peso(a);
    const [gb, vb] = peso(b);
    return ga - gb || va - vb || a.localeCompare(b, 'es');
  });
}
