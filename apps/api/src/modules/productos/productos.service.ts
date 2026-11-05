import {
  normalizarParaBusqueda,
  type DatosCrearProducto,
  type DatosEditarProducto,
  type FiltrosProductos,
  type Pagina,
  type Producto,
  type Usuario,
} from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { categoriasRepository } from '../categorias/categorias.repository';
import { aProducto } from './productos.mapper';
import { productosRepository } from './productos.repository';

async function validarCodigoLibre(codigo: string | null | undefined, exceptoId?: string) {
  if (!codigo) return;
  const existente = await productosRepository.buscarPorCodigo(codigo, exceptoId);
  if (existente) throw errores.conflicto(`El código ${codigo} ya es de "${existente.nombre}"`);
}

async function validarCategoria(categoriaId: string | null | undefined) {
  if (categoriaId && !(await categoriasRepository.buscarPorId(categoriaId))) {
    throw errores.solicitudInvalida('La categoría elegida no existe');
  }
}

export const productosService = {
  async listar(filtros: FiltrosProductos, usuario: Usuario): Promise<Pagina<Producto>> {
    const { items, total } = await productosRepository.listar(filtros);
    return {
      items: items.map((fila) => aProducto(fila, usuario)),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    };
  },

  async obtener(id: string, usuario: Usuario): Promise<Producto> {
    const fila = await productosRepository.buscarPorId(id);
    if (!fila) throw errores.noEncontrado('No existe el producto');
    return aProducto(fila, usuario);
  },

  /** Lo usa el lector de código de barras. */
  async buscarPorCodigo(codigo: string, usuario: Usuario): Promise<Producto> {
    const fila = await productosRepository.buscarPorCodigo(codigo);
    if (!fila) throw errores.noEncontrado(`No hay ningún producto con el código ${codigo}`);
    return aProducto(fila, usuario);
  },

  async crear(datos: DatosCrearProducto, usuario: Usuario): Promise<Producto> {
    await validarCodigoLibre(datos.codigoBarras);
    await validarCategoria(datos.categoriaId);

    const { stockInicial, ...campos } = datos;
    const id = await productosRepository.crear(
      { ...campos, nombreBusqueda: normalizarParaBusqueda(campos.nombre) },
      campos.controlaStock ? stockInicial : 0,
      usuario.id,
    );
    return this.obtener(id, usuario);
  },

  async editar(id: string, cambios: DatosEditarProducto, usuario: Usuario): Promise<Producto> {
    await validarCodigoLibre(cambios.codigoBarras, id);
    await validarCategoria(cambios.categoriaId);

    const actualizado = await productosRepository.actualizar(id, {
      ...cambios,
      ...(cambios.nombre ? { nombreBusqueda: normalizarParaBusqueda(cambios.nombre) } : {}),
    });
    if (!actualizado) throw errores.noEncontrado('No existe el producto');
    return this.obtener(id, usuario);
  },
};
