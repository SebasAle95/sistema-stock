import type { SvgIconComponent } from '@mui/icons-material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import type { Permiso } from '@stock/shared';

export interface ItemNavegacion {
  titulo: string;
  ruta: string;
  Icono: SvgIconComponent;
  /** Si se indica, el ítem solo aparece para los roles que tienen este permiso. */
  permiso?: Permiso;
}

/**
 * Menú lateral. Cada módulo nuevo (productos, ventas, caja...) suma una entrada acá.
 * Íconos disponibles: https://mui.com/material-ui/material-icons/
 */
export const navegacion: ItemNavegacion[] = [
  { titulo: 'Inicio', ruta: '/', Icono: HomeOutlinedIcon },
  { titulo: 'Usuarios', ruta: '/usuarios', Icono: ManageAccountsOutlinedIcon, permiso: 'usuarios.gestionar' },
];
