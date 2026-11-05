/**
 * CONFIGURACIÓN DEL NEGOCIO
 *
 * Es el único archivo que hay que cambiar para reutilizar esta base en otro
 * sistema de stock: nombre, moneda, zona horaria, medios de pago y colores.
 * Lo leen el frontend (título, tema, formatos) y la API (fechas, validaciones).
 */

export interface MedioDePago {
  id: string;
  nombre: string;
}

export interface ConfigNegocio {
  /** Nombre completo que se muestra en el título y en la barra superior. */
  nombre: string;
  /** Versión corta para espacios chicos (menú en celular, pestaña). */
  nombreCorto: string;
  /** Código ISO 4217 de la moneda. */
  moneda: string;
  /** Idioma y formato regional para números y fechas. */
  locale: string;
  /** Zona horaria en la que se cuentan los días (cierres de caja, estadísticas). */
  zonaHoraria: string;
  mediosDePago: readonly MedioDePago[];
  tema: {
    /** Color principal: barra superior, botones, elementos activos. */
    primario: string;
    /** Color de acento. */
    secundario: string;
  };
}

export const negocio = {
  nombre: 'Sistema de Stock',
  nombreCorto: 'Stock',
  moneda: 'ARS',
  locale: 'es-AR',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  mediosDePago: [
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'mercado_pago', nombre: 'Mercado Pago' },
  ],
  tema: {
    primario: '#5b2a86',
    secundario: '#c792ff',
  },
} as const satisfies ConfigNegocio;
