'use client';

import AddIcon from '@mui/icons-material/Add';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
  formatearFechaHora,
  formatearHora,
  formatearMoneda,
  nombreMedioDePago,
  type Caja,
  type MovimientoCaja,
} from '@stock/shared';
import { useState, type ReactNode } from 'react';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useConsulta } from '@/hooks/useConsulta';
import { ChipDiferencia } from './ChipDiferencia';
import { DialogoCerrarCaja } from './DialogoCerrarCaja';
import { DialogoMovimientoCaja } from './DialogoMovimientoCaja';
import { FormularioAbrirCaja } from './FormularioAbrirCaja';

interface Aviso {
  severidad: AlertColor;
  mensaje: string;
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: ReactNode; destacado?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
      <Typography sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
      <Typography sx={{ fontWeight: destacado ? 700 : 500, fontSize: destacado ? '1.15rem' : undefined }}>{valor}</Typography>
    </Stack>
  );
}

/** Resultado de un cierre: el admin ve las cuentas; el vendedor, solo que se cerró. */
function ResultadoCierre({ caja }: { caja: Caja }) {
  if (!caja.resumen) {
    return (
      <Alert severity="success">
        Caja #{caja.numero} cerrada. El administrador va a revisar el resultado.
      </Alert>
    );
  }
  return (
    <Card variant="outlined" sx={{ maxWidth: 480 }}>
      <CardHeader title={`Caja #${caja.numero} cerrada`} subheader={caja.cerradaEn ? formatearFechaHora(caja.cerradaEn) : undefined} />
      <Divider />
      <CardContent>
        <Dato etiqueta="Debería haber" valor={formatearMoneda(caja.resumen.efectivoEsperado)} />
        <Dato etiqueta="Se contó" valor={caja.efectivoContado != null ? formatearMoneda(caja.efectivoContado) : '—'} />
        <Dato etiqueta="Diferencia" valor={<ChipDiferencia diferencia={caja.diferencia} />} />
      </CardContent>
    </Card>
  );
}

export function PantallaCaja() {
  const caja = useConsulta<Caja | null>('/caja/actual');
  const abierta = caja.datos ?? null;
  const movimientos = useConsulta<MovimientoCaja[]>(abierta ? `/caja/movimientos?r=${abierta.id}` : null);
  const [dialogo, setDialogo] = useState<'movimiento' | 'cerrar' | null>(null);
  const [cerrada, setCerrada] = useState<Caja | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const recargar = () => {
    caja.recargar();
    movimientos.recargar();
  };

  let contenido: ReactNode;
  if (caja.datos === undefined) {
    contenido = <CircularProgress aria-label="Cargando caja" />;
  } else if (!abierta) {
    contenido = (
      <Stack spacing={3}>
        {cerrada && <ResultadoCierre caja={cerrada} />}
        <FormularioAbrirCaja
          alAbrir={() => {
            setCerrada(null);
            setAviso({ severidad: 'success', mensaje: 'Caja abierta. ¡Buenas ventas!' });
            recargar();
          }}
        />
      </Stack>
    );
  } else {
    const resumen = abierta.resumen;
    contenido = (
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        <Card variant="outlined">
          <CardHeader
            title={`Caja #${abierta.numero} abierta`}
            subheader={`La abrió ${abierta.abiertaPor.nombre} a las ${formatearHora(abierta.abiertaEn)}`}
          />
          <Divider />
          <CardContent>
            <Dato etiqueta="Efectivo inicial" valor={formatearMoneda(abierta.montoInicial)} />
            <Dato etiqueta="Ventas" valor={abierta.cantidadVentas} />
            {resumen && (
              <>
                <Divider sx={{ my: 1 }} />
                {resumen.porMedioDePago.map((m) => (
                  <Dato
                    key={m.medioPago}
                    etiqueta={`${nombreMedioDePago(m.medioPago)} (${m.cantidad})`}
                    valor={formatearMoneda(m.total)}
                  />
                ))}
                <Dato etiqueta="Total vendido" valor={formatearMoneda(resumen.totalVentas)} />
                <Divider sx={{ my: 1 }} />
                {resumen.ingresos > 0 && <Dato etiqueta="Entradas de efectivo" valor={`+ ${formatearMoneda(resumen.ingresos)}`} />}
                {resumen.egresos > 0 && <Dato etiqueta="Salidas de efectivo" valor={`− ${formatearMoneda(resumen.egresos)}`} />}
                <Dato etiqueta="Efectivo que debería haber" valor={formatearMoneda(resumen.efectivoEsperado)} destacado />
              </>
            )}
          </CardContent>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
            <Button startIcon={<AddIcon />} onClick={() => setDialogo('movimiento')}>
              Entrada / salida
            </Button>
            <Button variant="contained" color="warning" startIcon={<LockOutlinedIcon />} onClick={() => setDialogo('cerrar')}>
              Cerrar caja
            </Button>
          </Stack>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Entradas y salidas de efectivo" subheader="Lo que no son ventas: pagos, retiros, cambio." />
          <Divider />
          {movimientos.datos && movimientos.datos.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientos.datos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatearHora(m.creadoEn)}</TableCell>
                    <TableCell>
                      {m.motivo}
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {m.usuario.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: m.tipo === 'egreso' ? 'error.main' : 'success.main', whiteSpace: 'nowrap' }}
                    >
                      {m.tipo === 'egreso' ? '−' : '+'} {formatearMoneda(m.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <CardContent>
              <Typography sx={{ color: 'text.secondary' }}>Todavía no hubo entradas ni salidas.</Typography>
            </CardContent>
          )}
        </Card>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <EncabezadoPagina titulo="Caja" descripcion="Apertura, entradas y salidas de efectivo y cierre del turno." />
      {caja.error && <Alert severity="error">{caja.error}</Alert>}
      {contenido}

      {dialogo === 'movimiento' && (
        <DialogoMovimientoCaja
          alCerrar={() => setDialogo(null)}
          alGuardar={(mensaje) => {
            setDialogo(null);
            setAviso({ severidad: 'success', mensaje });
            recargar();
          }}
        />
      )}
      {dialogo === 'cerrar' && abierta && (
        <DialogoCerrarCaja
          caja={abierta}
          alCerrar={() => setDialogo(null)}
          alCerrarCaja={(resultado) => {
            setDialogo(null);
            setCerrada(resultado);
            recargar();
          }}
        />
      )}

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={5000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={aviso?.severidad ?? 'info'} variant="filled" onClose={() => setAviso(null)}>
          {aviso?.mensaje}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
