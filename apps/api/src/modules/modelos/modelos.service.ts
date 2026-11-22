import {
  nombreVariante,
  type DatosCombinacion,
  type DatosEditarModelo,
  type DatosNuevoModelo,
  type FiltrosModelos,
  type Modelo,
  type Pagina,
  type ResumenModelo,
  type Usuario,
} from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { categoriasRepository } from '../categorias/categorias.repository';
import { aModelo, aResumenModelo } from './modelos.mapper';
import { modelosRepository } from './modelos.repository';

async function validarCategoria(categoriaId: string | null | undefined) {
  if (categoriaId && !(await categoriasRepository.buscarPorId(categoriaId))) {
    throw errores.solicitudInvalida('La categoría elegida no existe');
  }
}

/** Los códigos escritos a mano no pueden repetirse entre sí ni estar en otro producto. */
async function validarCodigos(combinaciones: DatosCombinacion[]) {
  const codigos = combinaciones.flatMap((c) => (c.codigoBarras ? [c.codigoBarras] : []));
  const repetido = codigos.find((codigo, i) => codigos.indexOf(codigo) !== i);
  if (repetido) throw errores.solicitudInvalida(`El código ${repetido} está en dos combinaciones`);

  const [usado] = await modelosRepository.buscarCodigosUsados(codigos);
  if (usado) throw errores.conflicto(`El código ${usado.codigo} ya es de "${usado.nombre}"`);
}

export const modelosService = {
  async listar(filtros: FiltrosModelos): Promise<Pagina<ResumenModelo>> {
    const { items, total } = await modelosRepository.listar(filtros);
    return { items: items.map(aResumenModelo), total, pagina: filtros.pagina, porPagina: filtros.porPagina };
  },

  async obtener(id: string, usuario: Usuario): Promise<Modelo> {
    const [fila, variantes] = await Promise.all([modelosRepository.buscarPorId(id), modelosRepository.variantes(id)]);
    if (!fila) throw errores.noEncontrado('No existe el modelo');
    return aModelo(fila, variantes, usuario);
  },

  async crear(datos: DatosNuevoModelo, usuario: Usuario): Promise<Modelo> {
    await validarCategoria(datos.categoriaId);
    await validarCodigos(datos.combinaciones);

    const { combinaciones, ...modelo } = datos;
    const id = await modelosRepository.crear(modelo, combinaciones, usuario.id);
    return this.obtener(id, usuario);
  },

  async editar(id: string, cambios: DatosEditarModelo, usuario: Usuario): Promise<Modelo> {
    await validarCategoria(cambios.categoriaId);
    if (!(await modelosRepository.actualizar(id, cambios))) throw errores.noEncontrado('No existe el modelo');
    return this.obtener(id, usuario);
  },

  /** Talles o colores nuevos: se crean con el precio, el costo y el stock mínimo actuales del modelo. */
  async agregarCombinaciones(id: string, combinaciones: DatosCombinacion[], usuario: Usuario): Promise<Modelo> {
    const actual = await this.obtener(id, usuario);
    const clave = (talle: string | null, color: string | null) =>
      `${talle?.toLowerCase() ?? ''}|${color?.toLowerCase() ?? ''}`;
    const existentes = new Set(actual.variantes.map((v) => clave(v.talle, v.color)));
    const repetida = combinaciones.find((c) => existentes.has(clave(c.talle, c.color)));
    if (repetida) {
      throw errores.conflicto(`"${nombreVariante(actual.nombre, repetida.color, repetida.talle)}" ya existe`);
    }
    await validarCodigos(combinaciones);

    if (!(await modelosRepository.agregarCombinaciones(id, combinaciones, usuario.id))) {
      throw errores.noEncontrado('No existe el modelo');
    }
    return this.obtener(id, usuario);
  },
};
