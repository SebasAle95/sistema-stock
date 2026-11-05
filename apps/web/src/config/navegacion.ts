import type { SvgIconComponent } from '@mui/icons-material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

export interface ItemNavegacion {
  titulo: string;
  ruta: string;
  Icono: SvgIconComponent;
}

/**
 * Menú lateral. Cada módulo nuevo (productos, ventas, caja...) suma una entrada acá.
 * Íconos disponibles: https://mui.com/material-ui/material-icons/
 */
export const navegacion: ItemNavegacion[] = [{ titulo: 'Inicio', ruta: '/', Icono: HomeOutlinedIcon }];
