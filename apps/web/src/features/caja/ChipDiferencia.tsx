import Chip from '@mui/material/Chip';
import { formatearMoneda } from '@stock/shared';

/** Diferencia de caja: verde si cierra justo, rojo si falta plata, naranja si sobra. */
export function ChipDiferencia({ diferencia }: { diferencia: number | null | undefined }) {
  if (diferencia == null) return <>—</>;
  if (diferencia === 0) return <Chip size="small" color="success" label="Justa" />;
  return (
    <Chip
      size="small"
      color={diferencia < 0 ? 'error' : 'warning'}
      label={`${diferencia < 0 ? 'Falta' : 'Sobra'} ${formatearMoneda(Math.abs(diferencia))}`}
    />
  );
}
