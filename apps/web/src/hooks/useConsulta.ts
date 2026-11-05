'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Resultado<T> {
  clave: string;
  datos?: T;
  error?: string;
}

/**
 * Consulta un GET de la API y se vuelve a ejecutar cuando cambia la ruta.
 * Mientras carga una consulta nueva, conserva los datos anteriores (la tabla no "parpadea").
 *
 *   const { datos, cargando, error, recargar } = useConsulta<Producto[]>('/productos');
 *
 * Con `ruta = null` no consulta nada.
 */
export function useConsulta<T>(ruta: string | null) {
  const [recargas, setRecargas] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [ultimosDatos, setUltimosDatos] = useState<T | undefined>(undefined);

  const clave = ruta === null ? null : `${ruta}#${recargas}`;

  useEffect(() => {
    if (ruta === null || clave === null) return;
    let cancelado = false;

    api
      .get<T>(ruta)
      .then((datos) => {
        if (cancelado) return;
        setResultado({ clave, datos });
        setUltimosDatos(datos);
      })
      .catch((error: unknown) => {
        if (!cancelado) setResultado({ clave, error: mensajeDeError(error) });
      });

    return () => {
      cancelado = true;
    };
  }, [ruta, clave]);

  const actual = resultado?.clave === clave ? resultado : null;
  const recargar = useCallback(() => setRecargas((n) => n + 1), []);

  return {
    datos: ultimosDatos,
    cargando: clave !== null && actual === null,
    error: actual?.error ?? null,
    recargar,
  };
}
