'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatearNumero, nombreVariante, parsearNumero } from '@stock/shared';
import { useState } from 'react';
import { MuestraColor } from './MuestraColor';

/** Identifica una combinación sin importar mayúsculas: "m|negro". */
export const claveCombinacion = (talle: string | null, color: string | null) =>
  `${talle?.toLowerCase() ?? ''}|${color?.toLowerCase() ?? ''}`;

/** Unidades escritas en una celda: vacío es 0; null si no es un entero válido. */
export function unidades(texto: string | undefined): number | null {
  const numero = parsearNumero(texto ?? '') ?? 0;
  return Number.isInteger(numero) && numero >= 0 && numero <= 1_000_000 ? numero : null;
}

interface Props {
  talles: string[];
  colores: string[];
  /** Texto escrito en cada celda, por clave de combinación. */
  valores: Record<string, string>;
  alCambiar: (valores: Record<string, string>) => void;
  /** Combinaciones que ya existen (al agregar talles o colores): muestran su stock y no se editan. */
  existentes?: Map<string, number>;
}

/** Stock inicial de cada combinación: una fila por color y una columna por talle. */
export function GrillaStock({ talles, colores, valores, alCambiar, existentes = new Map() }: Props) {
  const [paraTodas, setParaTodas] = useState('');
  const filas = colores.length > 0 ? colores : [null];
  const columnas = talles.length > 0 ? talles : [null];

  const nuevas = filas.flatMap((color) =>
    columnas.flatMap((talle) => (existentes.has(claveCombinacion(talle, color)) ? [] : [claveCombinacion(talle, color)])),
  );
  const total = nuevas.reduce((suma, clave) => suma + (unidades(valores[clave]) ?? 0), 0);
  const cantidadParaTodas = unidades(paraTodas);

  return (
    <Box>
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              <TableCell>{colores.length > 0 ? 'Color' : ''}</TableCell>
              {columnas.map((talle) => (
                <TableCell key={talle ?? 'sin-talle'} align="center">
                  {talle ?? 'Unidades'}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((color) => (
              <TableRow key={color ?? 'sin-color'}>
                <TableCell component="th" scope="row">
                  {color ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <MuestraColor color={color} />
                      <span>{color}</span>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Sin color
                    </Typography>
                  )}
                </TableCell>
                {columnas.map((talle) => {
                  const clave = claveCombinacion(talle, color);
                  const actual = existentes.get(clave);
                  if (actual !== undefined) {
                    return (
                      <TableCell key={clave} align="center">
                        <Tooltip title={`Ya existe: tiene ${formatearNumero(actual)} unidades`}>
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {formatearNumero(actual)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    );
                  }
                  const invalido = unidades(valores[clave]) === null;
                  return (
                    <TableCell key={clave} align="center" sx={{ py: 0.75 }}>
                      <TextField
                        size="small"
                        value={valores[clave] ?? ''}
                        onChange={(e) => alCambiar({ ...valores, [clave]: e.target.value })}
                        placeholder="0"
                        error={invalido}
                        autoComplete="off"
                        slotProps={{
                          htmlInput: {
                            inputMode: 'numeric',
                            'aria-label': `Stock de ${nombreVariante('', color, talle) || 'la prenda'}`,
                            style: { textAlign: 'center', width: 44 },
                          },
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 1.5, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            label="Mismo stock en todas"
            value={paraTodas}
            onChange={(e) => setParaTodas(e.target.value)}
            error={cantidadParaTodas === null}
            autoComplete="off"
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            sx={{ width: 170 }}
          />
          <Button
            disabled={!paraTodas.trim() || cantidadParaTodas === null}
            onClick={() =>
              alCambiar({ ...valores, ...Object.fromEntries(nuevas.map((clave) => [clave, String(cantidadParaTodas)])) })
            }
          >
            Aplicar
          </Button>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {nuevas.length === 1 ? '1 combinación' : `${formatearNumero(nuevas.length)} combinaciones`} ·{' '}
          <strong>{formatearNumero(total)}</strong> {total === 1 ? 'unidad' : 'unidades'}
        </Typography>
      </Stack>
    </Box>
  );
}
