'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  erroresDeCampos,
  esquemaAnularVenta,
  formatearFechaHora,
  formatearMoneda,
  nombreMedioDePago,
  type Venta,
} from '@stock/shared';
import { useState } from 'react';
import { useSesion } from '@/features/auth/SesionProvider';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Props {
  venta: Venta;
  alCerrar: () => void;
  alAnular: (venta: Venta) => void;
}

/** Ticket de una venta, con la opción de anularla (solo administradores). */
export function DialogoDetalleVenta({ venta, alCerrar, alAnular }: Props) {
  const { tienePermiso } = useSesion();
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function anular() {
    const validacion = esquemaAnularVenta.safeParse({ motivo });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).motivo ?? 'Motivo inválido');
    setEnviando(true);
    try {
      alAnular(await api.post<Venta>(`/ventas/${venta.id}/anular`, validacion.data));
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : alCerrar} fullWidth maxWidth="xs">
      <DialogTitle>Venta #{venta.numero}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography sx={{ color: 'text.secondary' }}>
            {formatearFechaHora(venta.creadoEn)} · {venta.usuario.nombre} · {nombreMedioDePago(venta.medioPago)}
          </Typography>
          {venta.anulada && (
            <Alert severity="warning">
              Anulada{venta.anuladaEn ? ` el ${formatearFechaHora(venta.anuladaEn)}` : ''}: {venta.motivoAnulacion}
            </Alert>
          )}
          <Table size="small">
            <TableBody>
              {venta.items.map((i) => (
                <TableRow key={i.productoId}>
                  <TableCell sx={{ pl: 0 }}>
                    {i.cantidad} × {i.nombre}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatearMoneda(i.precioUnitario)} c/u
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>
                    {formatearMoneda(i.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>{formatearMoneda(venta.total)}</Typography>
          </Stack>
          {venta.montoRecibido != null && (
            <Typography sx={{ color: 'text.secondary' }}>
              Pagó con {formatearMoneda(venta.montoRecibido)} · vuelto {formatearMoneda(venta.vuelto ?? 0)}
            </Typography>
          )}

          {anulando && (
            <>
              <Divider />
              <Typography>Al anular, el stock vuelve a sumarse y la venta deja de contar en la caja.</Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Motivo" autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!venta.anulada && tienePermiso('ventas.anular') && !anulando && (
          <Button color="error" onClick={() => setAnulando(true)} sx={{ mr: 'auto' }}>
            Anular venta
          </Button>
        )}
        {anulando ? (
          <>
            <Button color="inherit" onClick={() => setAnulando(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" loading={enviando} onClick={() => void anular()}>
              Confirmar anulación
            </Button>
          </>
        ) : (
          <Button onClick={alCerrar}>Cerrar</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
