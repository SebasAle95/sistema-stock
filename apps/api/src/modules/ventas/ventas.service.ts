import {
  MEDIO_EFECTIVO,
  tienePermiso,
  type DatosNuevaVenta,
  type FiltrosVentas,
  type Pagina,
  type Usuario,
  type Venta,
} from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { redondear } from '../../utils/fechas';
import { cajaRepository } from '../caja/caja.repository';
import { ventasRepository, type LineaVenta } from './ventas.repository';

type FilaConItems = NonNullable<Awaited<ReturnType<typeof ventasRepository.buscarPorId>>>;

function aVenta(fila: FilaConItems): Venta {
  return {
    id: fila.id,
    numero: fila.numero,
    cajaId: fila.cajaId,
    usuario: { id: fila.usuarioId, nombre: fila.usuarioNombre },
    total: fila.total,
    medioPago: fila.medioPago,
    montoRecibido: fila.montoRecibido,
    vuelto: fila.vuelto,
    anulada: fila.anulada,
    motivoAnulacion: fila.motivoAnulacion,
    anuladaEn: fila.anuladaEn?.toISOString() ?? null,
    creadoEn: fila.creadoEn.toISOString(),
    items: fila.items.map((i) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
    })),
  };
}

export const ventasService = {
  async registrar(datos: DatosNuevaVenta, usuario: Usuario): Promise<Venta> {
    // Precios y costos salen de la base, nunca de lo que mande el navegador.
    const productos = await ventasRepository.buscarProductos(datos.items.map((i) => i.productoId));
    const porId = new Map(productos.map((p) => [p.id, p]));

    const lineas: LineaVenta[] = datos.items.map((item) => {
      const producto = porId.get(item.productoId);
      if (!producto) throw errores.solicitudInvalida('Uno de los productos no existe');
      if (!producto.activo) throw errores.solicitudInvalida(`"${producto.nombre}" está desactivado: no se puede vender`);
      return {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precioVenta,
        costoUnitario: producto.precioCosto,
        subtotal: redondear(producto.precioVenta * item.cantidad),
        controlaStock: producto.controlaStock,
      };
    });

    const total = redondear(lineas.reduce((suma, l) => suma + l.subtotal, 0));

    let montoRecibido: number | null = null;
    let vuelto: number | null = null;
    if (datos.medioPago === MEDIO_EFECTIVO && datos.montoRecibido !== null) {
      if (datos.montoRecibido < total) {
        throw errores.solicitudInvalida('El monto recibido es menor que el total', {
          formErrors: [],
          fieldErrors: { montoRecibido: ['Es menor que el total'] },
        });
      }
      montoRecibido = datos.montoRecibido;
      vuelto = redondear(datos.montoRecibido - total);
    }

    const id = await ventasRepository.registrar({
      usuarioId: usuario.id,
      medioPago: datos.medioPago,
      total,
      montoRecibido,
      vuelto,
      lineas,
    });
    return this.obtener(id, usuario);
  },

  async obtener(id: string, usuario: Usuario): Promise<Venta> {
    const fila = await ventasRepository.buscarPorId(id);
    if (!fila) throw errores.noEncontrado('No existe la venta');
    if (!tienePermiso(usuario.rol, 'ventas.ver_todas')) {
      const abierta = await cajaRepository.buscarAbierta();
      if (fila.cajaId !== abierta?.id) throw errores.prohibido('Solo podés ver las ventas de la caja abierta');
    }
    return aVenta(fila);
  },

  /** Quien no puede ver todas, ve solo las ventas de la caja abierta. */
  async listar(filtros: FiltrosVentas, usuario: Usuario): Promise<Pagina<Venta>> {
    let consulta = filtros;
    if (!tienePermiso(usuario.rol, 'ventas.ver_todas')) {
      const abierta = await cajaRepository.buscarAbierta();
      if (!abierta) return { items: [], total: 0, pagina: filtros.pagina, porPagina: filtros.porPagina };
      consulta = { ...filtros, cajaId: abierta.id, desde: undefined, hasta: undefined };
    }
    const { items, total } = await ventasRepository.listar(consulta);
    return { items: items.map(aVenta), total, pagina: filtros.pagina, porPagina: filtros.porPagina };
  },

  async anular(id: string, motivo: string, usuario: Usuario): Promise<Venta> {
    const rechazo = await ventasRepository.anular(id, usuario.id, motivo);
    if (rechazo) throw errores.solicitudInvalida(rechazo);
    return this.obtener(id, usuario);
  },
};
