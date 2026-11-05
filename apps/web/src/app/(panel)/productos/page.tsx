import type { Metadata } from 'next';
import { PantallaProductos } from '@/features/productos/PantallaProductos';

export const metadata: Metadata = { title: 'Productos' };

export default function PaginaProductos() {
  return <PantallaProductos />;
}
