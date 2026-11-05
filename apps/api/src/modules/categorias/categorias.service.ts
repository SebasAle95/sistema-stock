import type { Categoria } from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { categoriasRepository } from './categorias.repository';

export const categoriasService = {
  async listar(): Promise<Categoria[]> {
    return categoriasRepository.listarConCantidad();
  },

  async crear(nombre: string): Promise<Categoria> {
    if (await categoriasRepository.buscarPorNombre(nombre)) {
      throw errores.conflicto(`Ya existe la categoría "${nombre}"`);
    }
    const fila = await categoriasRepository.crear(nombre);
    return { id: fila.id, nombre: fila.nombre, cantidadProductos: 0 };
  },

  async renombrar(id: string, nombre: string): Promise<void> {
    if (await categoriasRepository.buscarPorNombre(nombre, id)) {
      throw errores.conflicto(`Ya existe la categoría "${nombre}"`);
    }
    if (!(await categoriasRepository.renombrar(id, nombre))) {
      throw errores.noEncontrado('No existe la categoría');
    }
  },

  async eliminar(id: string): Promise<void> {
    if (!(await categoriasRepository.eliminar(id))) {
      throw errores.noEncontrado('No existe la categoría');
    }
  },
};
