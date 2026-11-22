/**
 * Códigos de barras EAN-13.
 * Los códigos internos usan el prefijo 21: los que empiezan con 20 a 29 están
 * reservados para uso interno de cada comercio y nunca coinciden con productos de fábrica.
 */

const PREFIJO_INTERNO = '21';

/** Dígito verificador de los primeros 12 dígitos de un EAN-13. */
export function digitoVerificadorEAN13(doceDigitos: string): number {
  const suma = [...doceDigitos].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (suma % 10)) % 10;
}

/** true si el texto es un EAN-13 con su dígito verificador correcto. */
export function esEAN13Valido(codigo: string): boolean {
  return /^\d{13}$/.test(codigo) && digitoVerificadorEAN13(codigo.slice(0, 12)) === Number(codigo[12]);
}

/** Número de la secuencia → código interno. Ej: 1 → "2100000000017". */
export function codigoInterno(numero: number): string {
  const base = PREFIJO_INTERNO + String(numero).padStart(10, '0');
  if (base.length !== 12) throw new Error('Se agotaron los códigos internos');
  return base + digitoVerificadorEAN13(base);
}
