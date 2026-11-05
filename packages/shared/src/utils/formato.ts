import { negocio } from '../config/negocio';

const formateadorMoneda = new Intl.NumberFormat(negocio.locale, {
  style: 'currency',
  currency: negocio.moneda,
});

/** 1500.5 → "$ 1.500,50" */
export function formatearMoneda(valor: number): string {
  return formateadorMoneda.format(valor);
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
