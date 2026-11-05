import {
  tienePermiso,
  type Caja,
  type DatosCerrarCaja,
  type DatosMovimientoCaja,
  type FiltrosCajas,
  type MovimientoCaja,
  type Pagina,
  type Usuario,
} from '@stock/shared';
import { AppError, errores } from '../../shared/errors/AppError';
import { cajaRepository, type FilaCajaCompleta } from './caja.repository';

export const cajaCerrada = () =>
  new AppError(409, 'CAJA_CERRADA', 'No hay una caja abierta. Abrí la caja para empezar a vender.');

/**
 * Arma la caja para la API. Los totales, el esperado y la diferencia solo los ve
 * quien tiene `caja.ver_totales`: así el vendedor cierra "a ciegas".
 */
async function aCaja(fila: FilaCajaCompleta, usuario: Usuario): Promise<Caja> {
  const caja: Caja = {
    id: fila.id,
    numero: fila.numero,
    abiertaPor: { id: fila.abiertaPor, nombre: fila.abiertaPorNombre },
    abiertaEn: fila.abiertaEn.toISOString(),
    montoInicial: fila.montoInicial,
    cerradaPor: fila.cerradaPor && fila.cerradaPorNombre ? { id: fila.cerradaPor, nombre: fila.cerradaPorNombre } : null,
    cerradaEn: fila.cerradaEn?.toISOString() ?? null,
    cantidadVentas: fila.cantidadVentas,
  };
  if (tienePermiso(usuario.rol, 'caja.ver_totales')) {
    caja.resumen = await cajaRepository.resumen(fila);
    caja.efectivoContado = fila.efectivoContado;
    caja.diferencia = fila.diferencia;
    caja.notaCierre = fila.notaCierre;
    // En una caja cerrada vale lo que se calculó al cerrar.
    if (fila.efectivoEsperado !== null) caja.resumen.efectivoEsperado = fila.efectivoEsperado;
  }
  return caja;
}

async function cajaAbiertaOError() {
  const caja = await cajaRepository.buscarAbierta();
  if (!caja) throw cajaCerrada();
  return caja;
}

export const cajaService = {
  async actual(usuario: Usuario): Promise<Caja | null> {
    const fila = await cajaRepository.buscarAbierta();
    return fila ? aCaja(fila, usuario) : null;
  },

  async abrir(montoInicial: number, usuario: Usuario): Promise<Caja> {
    const abierta = await cajaRepository.buscarAbierta();
    if (abierta) {
      throw errores.conflicto(`Ya hay una caja abierta (la abrió ${abierta.abiertaPorNombre}). Cerrala antes de abrir otra.`);
    }
    const id = await cajaRepository.abrir(usuario.id, montoInicial);
    const fila = await cajaRepository.buscarPorId(id);
    if (!fila) throw new Error('No se encontró la caja recién abierta');
    return aCaja(fila, usuario);
  },

  async registrarMovimiento(datos: DatosMovimientoCaja, usuario: Usuario): Promise<void> {
    const caja = await cajaAbiertaOError();
    await cajaRepository.registrarMovimiento(caja.id, datos.tipo, datos.monto, datos.motivo, usuario.id);
  },

  async listarMovimientos(cajaId: string | null): Promise<MovimientoCaja[]> {
    const id = cajaId ?? (await cajaRepository.buscarAbierta())?.id;
    if (!id) return [];
    const filas = await cajaRepository.listarMovimientos(id);
    return filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      monto: f.monto,
      motivo: f.motivo,
      usuario: { id: f.usuarioId, nombre: f.usuarioNombre },
      creadoEn: f.creadoEn.toISOString(),
    }));
  },

  async cerrar(datos: DatosCerrarCaja, usuario: Usuario): Promise<Caja> {
    const caja = await cajaAbiertaOError();
    if (!(await cajaRepository.cerrar(caja.id, usuario.id, datos.efectivoContado, datos.nota || null))) {
      throw cajaCerrada();
    }
    const cerrada = await cajaRepository.buscarPorId(caja.id);
    if (!cerrada) throw new Error('No se encontró la caja cerrada');
    return aCaja(cerrada, usuario);
  },

  async historial(filtros: FiltrosCajas, usuario: Usuario): Promise<Pagina<Caja>> {
    const { items, total } = await cajaRepository.listarCerradas(filtros);
    return {
      items: await Promise.all(items.map((fila) => aCaja(fila, usuario))),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    };
  },

  async obtener(id: string, usuario: Usuario): Promise<Caja> {
    const fila = await cajaRepository.buscarPorId(id);
    if (!fila) throw errores.noEncontrado('No existe la caja');
    return aCaja(fila, usuario);
  },
};
