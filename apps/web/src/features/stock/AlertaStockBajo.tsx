'use client';

import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Pagina, Producto } from '@stock/shared';
import Link from 'next/link';
import { ChipStock } from '@/features/productos/ChipStock';
import { useConsulta } from '@/hooks/useConsulta';

/** Tarjeta de Inicio con los productos que llegaron al stock mínimo. */
export function AlertaStockBajo() {
  const { datos } = useConsulta<Pagina<Producto>>('/productos?stockBajo=true&porPagina=6');
  if (!datos) return null;

  const total = datos.total;
  return (
    <Card variant="outlined">
      <CardHeader
        avatar={<WarningAmberOutlinedIcon color={total > 0 ? 'warning' : 'disabled'} />}
        title="Stock bajo"
        subheader={
          total === 0
            ? 'Todos los productos están por encima del mínimo.'
            : total === 1
              ? '1 producto llegó al mínimo o se quedó sin stock.'
              : `${total} productos llegaron al mínimo o se quedaron sin stock.`
        }
        action={
          total > 0 && (
            <Button component={Link} href="/productos?stockBajo=1" size="small">
              Ver todos
            </Button>
          )
        }
      />
      {total > 0 && (
        <>
          <Divider />
          <CardContent>
            <Stack spacing={1}>
              {datos.items.map((p) => (
                <Stack key={p.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{p.nombre}</Typography>
                  <ChipStock stock={p.stock} stockMinimo={p.stockMinimo} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </>
      )}
    </Card>
  );
}
