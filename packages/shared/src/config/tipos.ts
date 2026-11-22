/**
 * Funcionalidades opcionales. Cada cliente prende las suyas en su configuración;
 * apagadas, no aparecen en el menú y la API no registra sus rutas.
 */
export const FUNCIONALIDADES = [
  /** Productos con talles y colores, cada combinación con su stock y su código (indumentaria). */
  'variantes',
  /** Cambios y devoluciones de productos vendidos, con vuelta al stock. */
  'devoluciones',
] as const;

export type Funcionalidad = (typeof FUNCIONALIDADES)[number];

export interface MedioDePago {
  id: string;
  nombre: string;
}

export interface ConfigNegocio {
  /** Identificador del cliente: es el valor de la variable CLIENTE al compilar y desplegar. */
  id: string;
  /** Nombre completo que se muestra en el título y en la barra superior. */
  nombre: string;
  /** Versión corta para espacios chicos (pestaña del navegador). */
  nombreCorto: string;
  /** Frase debajo del nombre en el login. */
  lema?: string;
  /** Código ISO 4217 de la moneda. */
  moneda: string;
  /** Idioma y formato regional para números y fechas. */
  locale: string;
  /** Zona horaria en la que se cuentan los días (cierres de caja, estadísticas). */
  zonaHoraria: string;
  /** Tiene que incluir "efectivo": la caja calcula el efectivo esperado con ese medio. */
  mediosDePago: readonly MedioDePago[];
  /** Logo opcional (archivo dentro de apps/web/public). Si no hay, se muestra un ícono. */
  logo?: {
    src: string;
    /** Texto alternativo: lo que dice el logo, para lectores de pantalla. */
    alt: string;
  };
  /** Imagen opcional del fondo del login (dentro de apps/web/public), sobre los colores de la marca. */
  fondoLogin?: string;
  tema: {
    /** Color principal: barra superior, botones, elementos activos. Con texto blanco tiene que leerse bien. */
    primario: string;
    /** Color de acento. */
    secundario: string;
  };
  /**
   * Estética general, con los mismos componentes y pantallas:
   * - "clasico" (por defecto): barra de color, login con fondo de la marca.
   * - "boutique": fondos claros y planos, títulos con serifa y login a pantalla partida (moda, tiendas).
   */
  estilo?: 'clasico' | 'boutique';
  funcionalidades: readonly Funcionalidad[];
}
