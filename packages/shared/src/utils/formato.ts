import { negocio } from '../config/negocio';

const monedaSinDecimales = new Intl.NumberFormat(negocio.locale, {
  style: 'currency',
  currency: negocio.moneda,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const monedaConDecimales = new Intl.NumberFormat(negocio.locale, {
  style: 'currency',
  currency: negocio.moneda,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat(negocio.locale);

/** 1500 → "$ 1.500" · 1500.5 → "$ 1.500,50" (los centavos solo si hay). */
export function formatearMoneda(valor: number): string {
  return (Number.isInteger(valor) ? monedaSinDecimales : monedaConDecimales).format(valor);
}

/** 12000 → "12.000" */
export function formatearNumero(valor: number): string {
  return numero.format(valor);
}

/** 0.255 → "25,5 %" */
export function formatearPorcentaje(valor: number, decimales = 0): string {
  return new Intl.NumberFormat(negocio.locale, {
    style: 'percent',
    maximumFractionDigits: decimales,
  }).format(valor);
}

/**
 * Formatea una fecha siempre en la zona horaria del negocio, sin importar
 * dónde corra el código (servidor en UTC o navegador).
 */
export function formatearFecha(
  fecha: Date | string,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: 'short' },
): string {
  return new Intl.DateTimeFormat(negocio.locale, {
    timeZone: negocio.zonaHoraria,
    ...opciones,
  }).format(new Date(fecha));
}

/** "04/11/2026, 21:30" */
export function formatearFechaHora(fecha: Date | string): string {
  return formatearFecha(fecha, { dateStyle: 'short', timeStyle: 'short' });
}

/** "21:30" */
export function formatearHora(fecha: Date | string): string {
  return formatearFecha(fecha, { timeStyle: 'short' });
}
