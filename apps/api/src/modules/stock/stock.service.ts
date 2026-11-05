import {
  tienePermiso,
  type DatosAjusteStock,
  type DatosIngresoStock,
  type FiltrosMovimientos,
  type MovimientoStock,
  type Pagina,
  type ResultadoIngresoStock,
  type Usuario,
} from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { stockRepository } from './stock.repository';

/** Verifica que todos los productos existan, estén activos y controlen stock. */
async function validarProductos(ids: string[]) {
  const encontrados = await stockRepository.buscarProductos(ids);
  const porId = new Map(encontrados.map((p) => [p.id, p]));

  for (const id of ids) {
    const producto = porId.get(id);
    if (!producto) throw errores.solicitudInvalida('Uno de los productos no existe');
    if (!producto.activo) throw errores.solicitudInvalida(`"${producto.nombre}" está desactivado`);
    if (!producto.controlaStock) {
      throw errores.solicitudInvalida(`"${producto.nombre}" no lleva control de stock`);
    }
  }
  return porId;
}

export const stockService = {
  async registrarIngreso(datos: DatosIngresoStock, usuario: Usuario): Promise<ResultadoIngresoStock> {
    await validarProductos(datos.items.map((i) => i.productoId));

    // El costo solo cuenta si quien carga puede ver costos (a un vendedor ni siquiera se le pide).
    const conCostos = tienePermiso(usuario.rol, 'productos.ver_costos');
    const items = datos.items.map((i) => ({ ...i, costoUnitario: conCostos ? i.costoUnitario : null }));

    await stockRepository.registrarIngreso(items, usuario.id, datos.nota || null, conCostos && datos.actualizarCosto);
    return { productos: items.length, unidades: items.reduce((suma, i) => suma + i.cantidad, 0) };
  },

  async ajustar(datos: DatosAjusteStock, usuario: Usuario) {
    const productos = await validarProductos([datos.productoId]);
    const producto = productos.get(datos.productoId);
    if (!producto) throw errores.noEncontrado('No existe el producto');

    if (datos.tipo === 'ajuste') {
      if (datos.stockReal === producto.stock) {
        throw errores.solicitudInvalida(`El stock ya es ${producto.stock}: no hay nada que ajustar`);
      }
      return stockRepository.aplicarAjuste(
        datos.productoId,
        'ajuste',
        (actual) => datos.stockReal - actual,
        usuario.id,
        datos.nota || null,
      );
    }

    if (datos.cantidad > producto.stock) {
      throw errores.solicitudInvalida(
        `Solo hay ${producto.stock} unidades de "${producto.nombre}". Si el stock está mal, hacé un ajuste.`,
      );
    }
    return stockRepository.aplicarAjuste(datos.productoId, 'merma', () => -datos.cantidad, usuario.id, datos.nota);
  },

  async listarMovimientos(filtros: FiltrosMovimientos, usuario: Usuario): Promise<Pagina<MovimientoStock>> {
    const conCostos = tienePermiso(usuario.rol, 'productos.ver_costos');
    const { items, total } = await stockRepository.listarMovimientos(filtros);
    return {
      items: items.map((fila) => ({
        id: fila.id,
        tipo: fila.tipo,
        cantidad: fila.cantidad,
        stockResultante: fila.stockResultante,
        ...(conCostos ? { costoUnitario: fila.costoUnitario } : {}),
        nota: fila.nota,
        producto: { id: fila.productoId, nombre: fila.productoNombre },
        usuario: { id: fila.usuarioId, nombre: fila.usuarioNombre },
        creadoEn: fila.creadoEn.toISOString(),
      })),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    };
  },
};
