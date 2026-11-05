'use client';

import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { Categoria } from '@stock/shared';
import { useState } from 'react';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Opcion {
  id: string | null;
  nombre: string;
  /** Si viene, es la opción "Agregar ...": crea la categoría al elegirla. */
  crear?: string;
}

const filtrar = createFilterOptions<Opcion>();

interface Props {
  categorias: Categoria[];
  valor: string | null;
  alCambiar: (categoriaId: string | null) => void;
  /** Se llama cuando se crea una categoría nueva desde el selector. */
  alCrear: (categoria: Categoria) => void;
  error?: string;
}

/** Elegir categoría o crear una nueva escribiendo su nombre. */
export function SelectorCategoria({ categorias, valor, alCambiar, alCrear, error }: Props) {
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);

  const opciones: Opcion[] = categorias.map((c) => ({ id: c.id, nombre: c.nombre }));
  const seleccionada = opciones.find((o) => o.id === valor) ?? null;

  async function elegir(opcion: Opcion | null) {
    setErrorCreacion(null);
    if (!opcion?.crear) return alCambiar(opcion?.id ?? null);

    setCreando(true);
    try {
      const nueva = await api.post<Categoria>('/categorias', { nombre: opcion.crear });
      alCrear(nueva);
      alCambiar(nueva.id);
    } catch (e) {
      setErrorCreacion(mensajeDeError(e));
    } finally {
      setCreando(false);
    }
  }

  return (
    <Autocomplete
      options={opciones}
      value={seleccionada}
      loading={creando}
      onChange={(_, opcion) => void elegir(opcion)}
      getOptionLabel={(opcion) => opcion.nombre}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(lista, estado) => {
        const filtradas = filtrar(lista, estado);
        const texto = estado.inputValue.trim();
        const existe = lista.some((o) => o.nombre.toLowerCase() === texto.toLowerCase());
        if (texto.length >= 2 && !existe) filtradas.push({ id: null, nombre: `Agregar "${texto}"`, crear: texto });
        return filtradas;
      }}
      noOptionsText="Escribí para crear una categoría"
      renderInput={(params) => (
        <TextField
          {...params}
          label="Categoría"
          placeholder="Sin categoría"
          error={Boolean(error ?? errorCreacion)}
          helperText={error ?? errorCreacion ?? 'Elegí una o escribí el nombre de una nueva.'}
        />
      )}
    />
  );
}
