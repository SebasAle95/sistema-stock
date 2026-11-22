'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { COLORES_SUGERIDOS, TALLES_LETRAS, TALLES_NUMEROS, ordenarTalles } from '@stock/shared';
import { useState } from 'react';
import { MuestraColor } from './MuestraColor';

const incluye = (lista: readonly string[], valor: string) => lista.some((v) => v.toLowerCase() === valor.toLowerCase());

/** "xl" → "XL": los talles con letras van en mayúsculas. "Único" o "38" quedan como están. */
function normalizarTalle(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  return /^[a-z]{1,4}$/i.test(limpio) ? limpio.toUpperCase() : limpio;
}

/** "azul marino" → "Azul marino". */
function normalizarColor(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

interface Fila {
  etiqueta?: string;
  opciones: readonly string[];
}

interface PropsGrupo {
  titulo: string;
  ayuda: string;
  filas: Fila[];
  seleccion: string[];
  /** Los que ya existen en el modelo: se muestran marcados y no se pueden quitar. */
  fijos: string[];
  alCambiar: (seleccion: string[]) => void;
  normalizar: (texto: string) => string;
  ordenar?: (lista: string[]) => string[];
  placeholder: string;
  largoMaximo: number;
  conMuestra?: boolean;
  /** Si viene, el grupo no se puede usar y se explica por qué. */
  bloqueado?: string;
}

function Grupo({
  titulo,
  ayuda,
  filas,
  seleccion,
  fijos,
  alCambiar,
  normalizar,
  ordenar = (lista) => lista,
  placeholder,
  largoMaximo,
  conMuestra,
  bloqueado,
}: PropsGrupo) {
  const [nuevo, setNuevo] = useState('');
  const conocidos = filas.flatMap((f) => f.opciones);
  const otros = seleccion.filter((v) => !incluye(conocidos, v));

  const poner = (valores: string[]) => alCambiar(ordenar(valores));
  const alternar = (valor: string) => {
    if (incluye(fijos, valor)) return;
    poner(incluye(seleccion, valor) ? seleccion.filter((v) => v.toLowerCase() !== valor.toLowerCase()) : [...seleccion, valor]);
  };
  const agregar = () => {
    const valor = normalizar(nuevo);
    if (!valor) return;
    if (!incluye(seleccion, valor)) poner([...seleccion, valor]);
    setNuevo('');
  };

  const chip = (valor: string, quitable = false) => {
    const elegido = incluye(seleccion, valor);
    const fijo = incluye(fijos, valor);
    const elemento = (
      <Chip
        key={valor}
        label={valor}
        icon={conMuestra ? <MuestraColor color={valor} /> : undefined}
        color={elegido ? 'primary' : 'default'}
        variant={elegido ? 'filled' : 'outlined'}
        onClick={fijo ? undefined : () => alternar(valor)}
        onDelete={quitable && !fijo ? () => alternar(valor) : undefined}
        aria-pressed={elegido}
        sx={{ fontWeight: elegido ? 600 : 400, '& .MuiChip-icon': { ml: 1 } }}
      />
    );
    return fijo ? (
      <Tooltip key={valor} title="Ya existe en el modelo">
        {elemento}
      </Tooltip>
    ) : (
      elemento
    );
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle2" component="h3">
          {titulo}
          {seleccion.length > 0 && (
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              {' '}
              · {seleccion.length}
            </Box>
          )}
        </Typography>
        {seleccion.length > fijos.length && !bloqueado && (
          <Button size="small" color="inherit" onClick={() => poner(seleccion.filter((v) => incluye(fijos, v)))}>
            Quitar {fijos.length > 0 ? 'los nuevos' : 'todos'}
          </Button>
        )}
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
        {bloqueado ?? ayuda}
      </Typography>

      {!bloqueado && (
        <Stack spacing={1.25}>
          {filas.map((fila, i) => (
            <Stack key={fila.etiqueta ?? i} direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {fila.etiqueta && (
                <Typography variant="caption" sx={{ color: 'text.secondary', width: 64, flexShrink: 0 }}>
                  {fila.etiqueta}
                </Typography>
              )}
              {fila.opciones.map((valor) => chip(valor))}
              {fila.etiqueta && (
                <Button
                  size="small"
                  onClick={() => poner([...seleccion, ...fila.opciones.filter((v) => !incluye(seleccion, v))])}
                  disabled={fila.opciones.every((v) => incluye(seleccion, v))}
                >
                  Todos
                </Button>
              )}
            </Stack>
          ))}
          {otros.length > 0 && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {otros.map((valor) => chip(valor, true))}
            </Stack>
          )}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', maxWidth: 320 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={placeholder}
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value.slice(0, largoMaximo))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregar();
                }
              }}
              slotProps={{ htmlInput: { 'aria-label': placeholder } }}
            />
            <IconButton aria-label={`Agregar ${titulo.toLowerCase()}`} onClick={agregar} disabled={!nuevo.trim()}>
              <AddIcon />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

interface Props {
  talles: string[];
  colores: string[];
  alCambiarTalles: (talles: string[]) => void;
  alCambiarColores: (colores: string[]) => void;
  tallesFijos?: string[];
  coloresFijos?: string[];
  /** Al agregar a un modelo que no tiene talles (o colores), ese grupo queda bloqueado. */
  bloquearTalles?: string;
  bloquearColores?: string;
}

/** Elegir los talles y los colores de un modelo: los habituales con un toque, y cualquier otro escribiéndolo. */
export function SelectorCurva({
  talles,
  colores,
  alCambiarTalles,
  alCambiarColores,
  tallesFijos = [],
  coloresFijos = [],
  bloquearTalles,
  bloquearColores,
}: Props) {
  return (
    <Stack spacing={3}>
      <Grupo
        titulo="Talles"
        ayuda="Tocá los que tiene esta prenda. Si no lleva talle, no marques ninguno."
        filas={[
          { etiqueta: 'Letras', opciones: TALLES_LETRAS },
          { etiqueta: 'Números', opciones: TALLES_NUMEROS },
        ]}
        seleccion={talles}
        fijos={tallesFijos}
        alCambiar={alCambiarTalles}
        normalizar={normalizarTalle}
        ordenar={ordenarTalles}
        placeholder="Otro talle (Único, 34, 48…)"
        largoMaximo={10}
        bloqueado={bloquearTalles}
      />
      <Grupo
        titulo="Colores"
        ayuda="Si viene en un solo color o no importa el color, no marques ninguno."
        filas={[{ opciones: COLORES_SUGERIDOS }]}
        seleccion={colores}
        fijos={coloresFijos}
        alCambiar={alCambiarColores}
        normalizar={normalizarColor}
        placeholder="Otro color (Azul marino, Floreado…)"
        largoMaximo={30}
        conMuestra
        bloqueado={bloquearColores}
      />
    </Stack>
  );
}
