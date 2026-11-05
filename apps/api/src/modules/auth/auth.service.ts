import type { DatosCambiarPassword, DatosLogin, Usuario } from '@stock/shared';
import { env } from '../../config/env';
import { AppError, errores } from '../../shared/errors/AppError';
import { aUsuarioPublico } from '../usuarios/usuarios.mapper';
import { usuariosRepository } from '../usuarios/usuarios.repository';
import { hashearPassword, necesitaRehash, simularVerificacion, verificarPassword } from './password';
import { sesionesRepository } from './sesiones.repository';
import { generarTokenDeSesion, hashearToken } from './tokens';

/** Intentos fallidos seguidos antes de bloquear la cuenta. */
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const DURACION_SESION_MS = env.SESION_HORAS * 60 * 60 * 1000;

/** Mismo mensaje si el usuario no existe o la contraseña es incorrecta: no revela cuál falló. */
const credencialesInvalidas = () => new AppError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');

function cuentaBloqueada(hasta: Date) {
  const minutos = Math.max(1, Math.ceil((hasta.getTime() - Date.now()) / 60_000));
  return new AppError(
    429,
    'CUENTA_BLOQUEADA',
    `Por seguridad, la cuenta quedó bloqueada por varios intentos fallidos. Probá de nuevo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
  );
}

interface DatosCliente {
  ip: string | undefined;
  agenteDeUsuario: string | undefined;
}

export const authService = {
  async iniciarSesion(datos: DatosLogin, cliente: DatosCliente) {
    const fila = await usuariosRepository.buscarPorUsuario(datos.usuario);

    if (!fila) {
      await simularVerificacion(datos.password);
      throw credencialesInvalidas();
    }

    if (fila.bloqueadoHasta && fila.bloqueadoHasta > new Date()) {
      throw cuentaBloqueada(fila.bloqueadoHasta);
    }

    if (!(await verificarPassword(datos.password, fila.passwordHash))) {
      const bloqueadoHasta = await usuariosRepository.registrarIntentoFallido(fila.id, MAX_INTENTOS, MINUTOS_BLOQUEO);
      console.warn(`🔒 Ingreso fallido para "${fila.usuario}" desde ${cliente.ip ?? 'IP desconocida'}`);
      if (bloqueadoHasta) throw cuentaBloqueada(bloqueadoHasta);
      throw credencialesInvalidas();
    }

    // Recién con la contraseña correcta se informa que está desactivado (no sirve para adivinar usuarios).
    if (!fila.activo) {
      throw new AppError(403, 'USUARIO_INACTIVO', 'Tu usuario está desactivado. Hablá con el administrador.');
    }

    if (necesitaRehash(fila.passwordHash)) {
      await usuariosRepository.actualizar(fila.id, { passwordHash: await hashearPassword(datos.password) });
    }

    await usuariosRepository.registrarIngreso(fila.id);
    await sesionesRepository.eliminarVencidas();

    const { token, tokenHash } = generarTokenDeSesion();
    const expiraEn = new Date(Date.now() + DURACION_SESION_MS);
    await sesionesRepository.crear({
      tokenHash,
      usuarioId: fila.id,
      expiraEn,
      ip: cliente.ip ?? null,
      agenteDeUsuario: cliente.agenteDeUsuario?.slice(0, 300) ?? null,
    });

    return { token, expiraEn, usuario: aUsuarioPublico({ ...fila, ultimoAcceso: new Date() }) };
  },

  /**
   * Valida el token de la cookie. Devuelve null si no existe, venció o el usuario fue desactivado.
   * Si a la sesión le queda menos de la mitad de su duración, la renueva (`renovadaHasta`).
   */
  async validarSesion(token: string) {
    const fila = await sesionesRepository.buscarConUsuario(hashearToken(token));
    if (!fila) return null;

    if (fila.sesion.expiraEn <= new Date() || !fila.usuario.activo) {
      await sesionesRepository.eliminar(fila.sesion.id);
      return null;
    }

    let renovadaHasta: Date | undefined;
    if (fila.sesion.expiraEn.getTime() - Date.now() < DURACION_SESION_MS / 2) {
      renovadaHasta = new Date(Date.now() + DURACION_SESION_MS);
      await sesionesRepository.extender(fila.sesion.id, renovadaHasta);
    }

    return { sesionId: fila.sesion.id, usuario: aUsuarioPublico(fila.usuario), renovadaHasta };
  },

  async cerrarSesion(token: string): Promise<void> {
    await sesionesRepository.eliminarPorTokenHash(hashearToken(token));
  },

  /** Cambia la contraseña propia y cierra las demás sesiones abiertas del usuario. */
  async cambiarPassword(usuarioId: string, sesionId: string, datos: DatosCambiarPassword): Promise<Usuario> {
    const fila = await usuariosRepository.buscarPorId(usuarioId);
    if (!fila) throw errores.noAutorizado();

    if (!(await verificarPassword(datos.passwordActual, fila.passwordHash))) {
      throw new AppError(400, 'PASSWORD_ACTUAL_INCORRECTA', 'La contraseña actual no es correcta', {
        formErrors: [],
        fieldErrors: { passwordActual: ['La contraseña actual no es correcta'] },
      });
    }

    const actualizado = await usuariosRepository.actualizar(usuarioId, {
      passwordHash: await hashearPassword(datos.passwordNueva),
      debeCambiarPassword: false,
    });
    await sesionesRepository.eliminarDeUsuario(usuarioId, sesionId);

    if (!actualizado) throw errores.noAutorizado();
    return aUsuarioPublico(actualizado);
  },
};
