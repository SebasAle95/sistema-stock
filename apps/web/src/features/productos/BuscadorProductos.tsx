'use client';

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatearMoneda, type Pagina, type Producto } from '@stock/shared';
import { useState, type KeyboardEvent, type Ref } from 'react';
import { useConsulta } from '@/hooks/useConsulta';
import { pareceCodigoDeBarras, useLectorCodigoBarras } from '@/hooks/useLectorCodigoBarras';
import { useValorDiferido } from '@/hooks/useValorDiferido';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';

interface Props {
  /** Producto elegido (por la pistola, por código escrito o de la lista de resultados). */
  alElegir: (producto: Producto) => void;
  /** Se leyó un código que no existe. */
  alNoEncontrar: (codigo: string) => void;
  alError: (mensaje: string) => void;
  /** Para ocultar de la lista lo que no corresponde (por ejemplo, sin control de stock). */
  filtrar?: (producto: Producto) => boolean;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Desactiva la escucha de la pistola (por ejemplo, con un diálogo abierto). */
  pausado?: boolean;
}

/**
 * Buscador de productos para pantallas operativas (venta, ingreso de mercadería):
 * - Pistola: funciona aunque el foco no esté en el campo.
 * - Código escrito a mano + Enter.
 * - Nombre: muestra resultados mientras se escribe (para lo que no tiene código).
 */
export function BuscadorProductos({
  alElegir,
  alNoEncontrar,
  alError,
  filtrar,
  placeholder = 'Escaneá un producto o buscalo por nombre',
  inputRef,
  pausado = false,
}: Props) {
  const [texto, setTexto] = useState('');
  const termino = useValorDiferido(texto.trim(), 250);
  const ruta =
    termino.length >= 2 && !pareceCodigoDeBarras(termino)
      ? `/productos?${new URLSearchParams({ buscar: termino, porPagina: '8' })}`
      : null;
  const consulta = useConsulta<Pagina<Producto>>(ruta);
  const opciones = ruta ? (consulta.datos?.items ?? []).filter((p) => !filtrar || filtrar(p)) : [];

  async function buscarCodigo(codigo: string) {
    try {
      alElegir(await api.get<Producto>(`/productos/codigo/${encodeURIComponent(codigo)}`));
    } catch (error) {
      if (error instanceof ErrorDeApi && error.status === 404) alNoEncontrar(codigo);
      else alError(mensajeDeError(error));
    }
  }

  useLectorCodigoBarras((codigo) => void buscarCodigo(codigo), !pausado);

  function alTeclear(evento: KeyboardEvent & { defaultMuiPrevented?: boolean }) {
    if (evento.key === 'Enter' && pareceCodigoDeBarras(texto)) {
      evento.defaultMuiPrevented = true;
      evento.preventDefault();
      const codigo = texto.trim();
      setTexto('');
      void buscarCodigo(codigo);
    }
  }

  return (
    <Autocomplete<Producto, false, false, true>
      freeSolo
      options={opciones}
      filterOptions={(lista) => lista}
      value={null}
      inputValue={texto}
      loading={consulta.cargando}
      onInputChange={(_, valor, motivo) => {
        if (motivo !== 'reset') setTexto(valor);
      }}
      onChange={(_, valor) => {
        if (valor && typeof valor !== 'string') {
          alElegir(valor);
          setTexto('');
        }
      }}
      onKeyDown={alTeclear}
      getOptionLabel={(opcion) => (typeof opcion === 'string' ? opcion : opcion.nombre)}
      renderOption={(props, producto) => {
        const { key, ...resto } = props;
        return (
          <Box component="li" key={key} {...resto}>
            <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 500 }}>{producto.nombre}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {producto.categoria?.nombre ?? 'Sin categoría'}
                  {producto.controlaStock ? ` · stock ${producto.stock}` : ''}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatearMoneda(producto.precioVenta)}</Typography>
            </Stack>
          </Box>
        );
      }}
      noOptionsText={termino.length >= 2 ? 'No hay productos con ese nombre' : 'Escribí al menos 2 letras'}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          autoFocus
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <QrCodeScannerIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
