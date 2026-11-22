import { ordenarTalles, tienePermiso, type Modelo, type ResumenModelo, type Usuario } from '@stock/shared';
import { aProducto } from '../productos/productos.mapper';
import type { FilaProductoConCategoria } from '../productos/productos.repository';
import type { FilaModeloConCategoria, modelosRepository } from './modelos.repository';

type FilaResumen = Awaited<ReturnType<typeof modelosRepository.listar>>['items'][number];

const unicos = (valores: (string | null)[]) => [...new Set(valores.filter((v): v is string => v !== null))];
const ordenarColores = (colores: string[]) => [...colores].sort((a, b) => a.localeCompare(b, 'es'));

export function aResumenModelo(fila: FilaResumen): ResumenModelo {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoriaId && fila.categoriaNombre ? { id: fila.categoriaId, nombre: fila.categoriaNombre } : null,
    precioVenta: fila.precioVenta,
    talles: ordenarTalles(fila.talles),
    colores: ordenarColores(fila.colores),
    combinaciones: fila.combinaciones,
    stock: fila.stock,
    combinacionesStockBajo: fila.combinacionesStockBajo,
  };
}

/** El modelo con sus combinaciones ordenadas por color y talle. El costo, solo con permiso. */
export function aModelo(fila: FilaModeloConCategoria, variantes: FilaProductoConCategoria[], usuario: Usuario): Modelo {
  const talles = ordenarTalles(unicos(variantes.map((v) => v.talle)));
  const colores = ordenarColores(unicos(variantes.map((v) => v.color)));
  const posicion = (lista: string[], valor: string | null) => (valor === null ? -1 : lista.indexOf(valor));

  const modelo: Modelo = {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoriaId && fila.categoriaNombre ? { id: fila.categoriaId, nombre: fila.categoriaNombre } : null,
    precioVenta: fila.precioVenta,
    stockMinimo: fila.stockMinimo,
    talles,
    colores,
    variantes: [...variantes]
      .sort(
        (a, b) =>
          posicion(colores, a.color) - posicion(colores, b.color) || posicion(talles, a.talle) - posicion(talles, b.talle),
      )
      .map((v) => aProducto(v, usuario)),
  };
  if (tienePermiso(usuario.rol, 'productos.ver_costos')) modelo.precioCosto = fila.precioCosto;
  return modelo;
}
