import { negocio } from '../config/negocio';

/** Fecha de hoy ("AAAA-MM-DD") en la zona horaria del negocio, sin importar dónde corra el código. */
export function hoyEnNegocio(ahora: Date = new Date()): string {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: negocio.zonaHoraria }).format(ahora);
}

const aDate = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** "2026-11-05" + 1 → "2026-11-06" (aritmética de calendario, sin horas). */
export function sumarDias(fecha: string, dias: number): string {
  const d = aDate(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return aTexto(d);
}

/** Cantidad de días entre dos fechas, contando las dos puntas. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aDate(hasta).getTime() - aDate(desde).getTime()) / 86_400_000) + 1;
}

/** Primer día del mes de la fecha. */
export function inicioDeMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

/** Todas las fechas del rango, inclusive. */
export function fechasDelRango(desde: string, hasta: string): string[] {
  const total = diasEntre(desde, hasta);
  return Array.from({ length: Math.max(0, total) }, (_, i) => sumarDias(desde, i));
}
