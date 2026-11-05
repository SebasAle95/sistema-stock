// Sin caracteres que se confunden al dictarlos o leerlos (0/O, 1/l/I).
const LETRAS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMEROS = '23456789';
const TODOS = LETRAS + NUMEROS;

function indiceAleatorio(maximo: number): number {
  const valores = new Uint32Array(1);
  crypto.getRandomValues(valores);
  return (valores[0] ?? 0) % maximo;
}

/** Contraseña temporal aleatoria (criptográficamente segura) con al menos una letra y un número. */
export function generarPasswordTemporal(largo = 10): string {
  const caracteres = [LETRAS[indiceAleatorio(LETRAS.length)], NUMEROS[indiceAleatorio(NUMEROS.length)]];
  while (caracteres.length < largo) caracteres.push(TODOS[indiceAleatorio(TODOS.length)]);

  // Mezcla (Fisher-Yates) para que la letra y el número obligatorios no queden siempre al principio.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = indiceAleatorio(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}
