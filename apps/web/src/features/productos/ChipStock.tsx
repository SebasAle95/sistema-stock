import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { formatearNumero } from '@stock/shared';

interface Props {
  stock: number;
  stockMinimo: number;
  controlaStock?: boolean;
}

/** Stock con color: rojo sin stock, naranja si llegó al mínimo. */
export function ChipStock({ stock, stockMinimo, controlaStock = true }: Props) {
  if (!controlaStock) {
    return (
      <Tooltip title="Se prepara en el momento: no lleva stock">
        <Chip size="small" label="—" variant="outlined" sx={{ minWidth: 48, color: 'text.secondary' }} />
      </Tooltip>
    );
  }

  const color = stock <= 0 ? 'error' : stock <= stockMinimo ? 'warning' : 'default';
  const ayuda =
    stock <= 0 ? 'Sin stock' : stock <= stockMinimo ? `Stock bajo (mínimo ${stockMinimo})` : `Mínimo: ${stockMinimo}`;

  return (
    <Tooltip title={ayuda}>
      <Chip
        size="small"
        label={formatearNumero(stock)}
        color={color}
        variant={color === 'default' ? 'outlined' : 'filled'}
        sx={{ minWidth: 48, fontWeight: 600 }}
      />
    </Tooltip>
  );
}
