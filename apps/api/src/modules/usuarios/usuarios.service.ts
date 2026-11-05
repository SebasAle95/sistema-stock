import {
  ROL_ADMINISTRADOR,
  type DatosCrearUsuario,
  type DatosEditarUsuario,
  type Usuario,
} from '@stock/shared';
import { errores } from '../../shared/errors/AppError';
import { hashearPassword } from '../auth/password';
import { sesionesRepository } from '../auth/sesiones.repository';
import { aUsuarioPublico } from './usuarios.mapper';
import { usuariosRepository } from './usuarios.repository';

export const usuariosService = {
  async listar(): Promise<Usuario[]> {
    return (await usuariosRepository.listar()).map(aUsuarioPublico);
  },

  /** Crea un usuario con contraseña temporal: la tiene que cambiar en su primer ingreso. */
  async crear(datos: DatosCrearUsuario): Promise<Usuario> {
    if (await usuariosRepository.buscarPorUsuario(datos.usuario)) {
      throw errores.conflicto(`Ya existe el usuario "${datos.usuario}"`);
    }
    const fila = await usuariosRepository.crear({
      nombre: datos.nombre,
      usuario: datos.usuario,
      rol: datos.rol,
      passwordHash: await hashearPassword(datos.passwordTemporal),
      debeCambiarPassword: true,
    });
    return aUsuarioPublico(fila);
  },

  async editar(id: string, cambios: DatosEditarUsuario, actor: Usuario): Promise<Usuario> {
    const actual = await usuariosRepository.buscarPorId(id);
    if (!actual) throw errores.noEncontrado('No existe el usuario');

    if (id === actor.id) {
      if (cambios.rol !== undefined && cambios.rol !== actual.rol) {
        throw errores.prohibido('No podés cambiar tu propio rol');
      }
      if (cambios.activo === false) {
        throw errores.prohibido('No podés desactivar tu propio usuario');
      }
    }

    const dejaDeSerAdministradorActivo =
      actual.rol === ROL_ADMINISTRADOR &&
      actual.activo &&
      ((cambios.rol !== undefined && cambios.rol !== ROL_ADMINISTRADOR) || cambios.activo === false);

    if (dejaDeSerAdministradorActivo && (await usuariosRepository.contarAdministradoresActivos(id)) === 0) {
      throw errores.conflicto('Tiene que quedar al menos un administrador activo');
    }

    const actualizado = await usuariosRepository.actualizar(id, cambios);
    if (!actualizado) throw errores.noEncontrado('No existe el usuario');

    // Un usuario desactivado pierde el acceso en el momento.
    if (cambios.activo === false) await sesionesRepository.eliminarDeUsuario(id);

    return aUsuarioPublico(actualizado);
  },

  /** El administrador le pone una contraseña temporal; se cierran todas las sesiones del usuario. */
  async restablecerPassword(id: string, passwordTemporal: string, actor: Usuario): Promise<void> {
    if (id === actor.id) {
      throw errores.prohibido('Para cambiar tu propia contraseña usá "Cambiar contraseña"');
    }

    const actualizado = await usuariosRepository.actualizar(id, {
      passwordHash: await hashearPassword(passwordTemporal),
      debeCambiarPassword: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    });
    if (!actualizado) throw errores.noEncontrado('No existe el usuario');

    await sesionesRepository.eliminarDeUsuario(id);
  },
};
