'use client';

import { useEffect, useState } from 'react';

/** Devuelve `valor` recién cuando deja de cambiar por `ms` milisegundos (para buscar mientras se escribe). */
export function useValorDiferido<T>(valor: T, ms = 300): T {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDiferido(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);

  return diferido;
}
