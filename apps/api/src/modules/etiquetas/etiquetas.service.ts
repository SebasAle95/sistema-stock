import type { ResultadoCodigos, Usuario } from '@stock/shared';
import { aProducto } from '../productos/productos.mapper';
import { etiquetasRepository } from './etiquetas.repository';

export const etiquetasService = {
  /** Códigos internos para los que no tienen; devuelve los productos pedidos, en el mismo orden. */
  async generarCodigos(productoIds: string[], usuario: Usuario): Promise<ResultadoCodigos> {
    const ids = [...new Set(productoIds)];
    const asignados = await etiquetasRepository.asignarCodigos(ids);
    const filas = await etiquetasRepository.buscarProductos(ids);
    const porId = new Map(filas.map((fila) => [fila.id, aProducto(fila, usuario)]));
    return { asignados, productos: ids.flatMap((id) => porId.get(id) ?? []) };
  },
};
