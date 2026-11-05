'use client';

import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useState, type ReactNode } from 'react';

export interface DatosTabla {
  columnas: string[];
  filas: (string | number)[][];
  /** Índices de las columnas numéricas (se alinean a la derecha). */
  numericas?: number[];
}

interface Props {
  titulo: string;
  subtitulo?: string;
  tabla: DatosTabla;
  children: ReactNode;
}

/**
 * Tarjeta para un gráfico con su vista de tabla: todo valor que el gráfico
 * muestra (o esconde en la ayuda emergente) también se puede leer sin pasar el mouse.
 */
export function TarjetaGrafico({ titulo, subtitulo, tabla, children }: Props) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico');

  return (
    <Card variant="outlined">
      <CardHeader
        title={titulo}
        subheader={subtitulo}
        slotProps={{ title: { variant: 'h6' } }}
        action={
          <ToggleButtonGroup size="small" exclusive value={vista} onChange={(_, v: typeof vista | null) => v && setVista(v)}>
            <Tooltip title="Gráfico">
              <ToggleButton value="grafico" aria-label="Ver gráfico">
                <BarChartOutlinedIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Tabla">
              <ToggleButton value="tabla" aria-label="Ver tabla">
                <TableRowsOutlinedIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {vista === 'grafico' ? (
          children
        ) : (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {tabla.columnas.map((c, i) => (
                    <TableCell key={c} align={tabla.numericas?.includes(i) ? 'right' : 'left'}>
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tabla.filas.map((fila, i) => (
                  <TableRow key={i}>
                    {fila.map((valor, j) => (
                      <TableCell
                        key={j}
                        align={tabla.numericas?.includes(j) ? 'right' : 'left'}
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {valor}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
