'use client';

import AutorenewIcon from '@mui/icons-material/Autorenew';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { generarPasswordTemporal } from '@/lib/passwords';

interface Props {
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string;
}

/**
 * Contraseña temporal que el administrador le pasa al usuario. Se muestra en claro
 * (hay que comunicarla) y se puede generar al azar. El usuario la cambia al ingresar.
 */
export function CampoPasswordTemporal({ valor, alCambiar, error }: Props) {
  return (
    <TextField
      label="Contraseña temporal"
      fullWidth
      autoComplete="off"
      value={valor}
      onChange={(e) => alCambiar(e.target.value)}
      error={Boolean(error)}
      helperText={error ?? 'Pasásela al usuario: la va a tener que cambiar cuando ingrese.'}
      slotProps={{
        htmlInput: { spellCheck: false, style: { fontFamily: 'ui-monospace, Consolas, monospace' } },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Generar una al azar">
                <IconButton edge="end" aria-label="Generar contraseña" onClick={() => alCambiar(generarPasswordTemporal())}>
                  <AutorenewIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
