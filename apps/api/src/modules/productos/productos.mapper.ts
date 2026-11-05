import { tienePermiso, type Producto, type Usuario } from '@stock/shared';
import type { FilaProductoConCategoria } from './productos.repository';

/**
 * Convierte la fila en el producto que devuelve la API.
 * El costo se incluye solo si el usuario tiene permiso: a un vendedor ni siquiera le llega.
 */
export function aProducto(fila: FilaProductoConCategoria, usuario: Usuario): Producto {
  const producto: Producto = {
    id: fila.id,
    nombre: fila.nombre,
    codigoBarras: fila.codigoBarras,
    categoria: fila.categoriaId && fila.categoriaNombre ? { id: fila.categoriaId, nombre: fila.categoriaNombre } : null,
    precioVenta: fila.precioVenta,
    stock: fila.stock,
    stockMinimo: fila.stockMinimo,
    controlaStock: fila.controlaStock,
    accesoRapido: fila.accesoRapido,
    activo: fila.activo,
    creadoEn: fila.creadoEn.toISOString(),
    actualizadoEn: fila.actualizadoEn.toISOString(),
  };
  if (tienePermiso(usuario.rol, 'productos.ver_costos')) producto.precioCosto = fila.precioCosto;
  return producto;
}
