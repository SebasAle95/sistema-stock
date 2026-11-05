/** "Café  con LECHE" → "cafe con leche". Para buscar sin importar acentos ni mayúsculas. */
export function normalizarParaBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convierte lo que escribe una persona en Argentina en un número:
 *   "1500" → 1500 · "1.500" → 1500 · "1500,50" → 1500.5 · "1.500,50" → 1500.5 · "1.5" → 1.5
 * Devuelve null si está vacío y NaN si no es un número válido.
 */
export function parsearNumero(texto: string): number | null {
  let limpio = texto.trim().replace(/[\s$]/g, '');
  if (limpio === '') return null;

  if (limpio.includes(',')) {
    // Con coma decimal, los puntos son separadores de miles.
    limpio = limpio.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // "1.500" o "12.000.000": puntos de miles.
    limpio = limpio.replace(/\./g, '');
  }

  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN;
}
