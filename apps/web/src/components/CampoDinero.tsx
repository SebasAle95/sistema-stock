'use client';

import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Props = Omit<TextFieldProps, 'onChange' | 'value'> & {
  valor: string;
  alCambiar: (valor: string) => void;
};

/**
 * Campo para importes. Se guarda como texto y se convierte con `parsearNumero`,
 * que entiende "1.500", "1500,50", etc.
 */
export function CampoDinero({ valor, alCambiar, slotProps, ...props }: Props) {
  return (
    <TextField
      {...props}
      value={valor}
      onChange={(e) => alCambiar(e.target.value)}
      autoComplete="off"
      slotProps={{
        ...slotProps,
        htmlInput: { inputMode: 'decimal' },
        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
      }}
    />
  );
}
