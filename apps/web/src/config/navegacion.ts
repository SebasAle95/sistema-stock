import type { SvgIconComponent } from '@mui/icons-material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import type { Permiso } from '@stock/shared';

export interface ItemNavegacion {
  titulo: string;
  ruta: string;
  Icono: SvgIconComponent;
  /** Si se indica, el ítem solo aparece para los roles que tienen este permiso. */
  permiso?: Permiso;
}

/**
 * Menú lateral. Cada módulo nuevo suma una entrada acá.
 * Íconos disponibles: https://mui.com/material-ui/material-icons/
 */
export const navegacion: ItemNavegacion[] = [
  { titulo: 'Inicio', ruta: '/', Icono: HomeOutlinedIcon },
  { titulo: 'Estadísticas', ruta: '/estadisticas', Icono: InsightsOutlinedIcon, permiso: 'estadisticas.ver' },
  { titulo: 'Vender', ruta: '/vender', Icono: PointOfSaleOutlinedIcon, permiso: 'ventas.registrar' },
  { titulo: 'Ventas', ruta: '/ventas', Icono: ReceiptLongOutlinedIcon, permiso: 'ventas.registrar' },
  { titulo: 'Caja', ruta: '/caja', Icono: AccountBalanceWalletOutlinedIcon, permiso: 'caja.operar' },
  { titulo: 'Historial de cajas', ruta: '/caja/historial', Icono: SavingsOutlinedIcon, permiso: 'caja.ver_totales' },
  { titulo: 'Productos', ruta: '/productos', Icono: LocalMallOutlinedIcon },
  { titulo: 'Ingreso de mercadería', ruta: '/stock/ingreso', Icono: LocalShippingOutlinedIcon, permiso: 'stock.ingresar' },
  { titulo: 'Movimientos de stock', ruta: '/stock/movimientos', Icono: HistoryOutlinedIcon, permiso: 'stock.ver_historial' },
  { titulo: 'Usuarios', ruta: '/usuarios', Icono: ManageAccountsOutlinedIcon, permiso: 'usuarios.gestionar' },
];
