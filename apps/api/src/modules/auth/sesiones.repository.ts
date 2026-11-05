import { and, eq, lt, ne } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { sesiones, usuarios } from '../../db/schema';

interface NuevaSesion {
  tokenHash: string;
  usuarioId: string;
  expiraEn: Date;
  ip: string | null;
  agenteDeUsuario: string | null;
}

export const sesionesRepository = {
  async crear(datos: NuevaSesion): Promise<void> {
    await obtenerDb().insert(sesiones).values(datos);
  },

  /** Sesión + su usuario en una sola consulta. */
  async buscarConUsuario(tokenHash: string) {
    const [fila] = await obtenerDb()
      .select({ sesion: sesiones, usuario: usuarios })
      .from(sesiones)
      .innerJoin(usuarios, eq(sesiones.usuarioId, usuarios.id))
      .where(eq(sesiones.tokenHash, tokenHash))
      .limit(1);
    return fila;
  },

  async extender(id: string, expiraEn: Date): Promise<void> {
    await obtenerDb().update(sesiones).set({ expiraEn }).where(eq(sesiones.id, id));
  },

  async eliminar(id: string): Promise<void> {
    await obtenerDb().delete(sesiones).where(eq(sesiones.id, id));
  },

  async eliminarPorTokenHash(tokenHash: string): Promise<void> {
    await obtenerDb().delete(sesiones).where(eq(sesiones.tokenHash, tokenHash));
  },

  /** Cierra todas las sesiones de un usuario, salvo (opcionalmente) la actual. */
  async eliminarDeUsuario(usuarioId: string, exceptoSesionId?: string): Promise<void> {
    await obtenerDb()
      .delete(sesiones)
      .where(
        and(eq(sesiones.usuarioId, usuarioId), exceptoSesionId ? ne(sesiones.id, exceptoSesionId) : undefined),
      );
  },

  async eliminarVencidas(): Promise<void> {
    await obtenerDb().delete(sesiones).where(lt(sesiones.expiraEn, new Date()));
  },
};
