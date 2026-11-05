import { and, asc, count, eq, ne, sql } from 'drizzle-orm';
import { obtenerDb } from '../../db/client';
import { usuarios, type FilaUsuario, type NuevaFilaUsuario } from '../../db/schema';

export const usuariosRepository = {
  listar(): Promise<FilaUsuario[]> {
    return obtenerDb().select().from(usuarios).orderBy(asc(usuarios.nombre));
  },

  async buscarPorId(id: string): Promise<FilaUsuario | undefined> {
    const [fila] = await obtenerDb().select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return fila;
  },

  async buscarPorUsuario(usuario: string): Promise<FilaUsuario | undefined> {
    const [fila] = await obtenerDb().select().from(usuarios).where(eq(usuarios.usuario, usuario)).limit(1);
    return fila;
  },

  async crear(datos: NuevaFilaUsuario): Promise<FilaUsuario> {
    const [fila] = await obtenerDb().insert(usuarios).values(datos).returning();
    if (!fila) throw new Error('No se pudo crear el usuario');
    return fila;
  },

  async actualizar(id: string, cambios: Partial<NuevaFilaUsuario>): Promise<FilaUsuario | undefined> {
    const [fila] = await obtenerDb().update(usuarios).set(cambios).where(eq(usuarios.id, id)).returning();
    return fila;
  },

  async contarAdministradoresActivos(exceptoId?: string): Promise<number> {
    const [fila] = await obtenerDb()
      .select({ total: count() })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.rol, 'administrador'),
          eq(usuarios.activo, true),
          exceptoId ? ne(usuarios.id, exceptoId) : undefined,
        ),
      );
    return fila?.total ?? 0;
  },

  /**
   * Suma un intento fallido en una sola consulta (sin carreras entre pedidos simultáneos).
   * Al llegar al máximo, bloquea la cuenta y reinicia el contador.
   * Devuelve la fecha de bloqueo si la cuenta quedó bloqueada.
   */
  async registrarIntentoFallido(id: string, maxIntentos: number, minutosBloqueo: number): Promise<Date | null> {
    const llegaAlMaximo = sql`${usuarios.intentosFallidos} + 1 >= ${maxIntentos}`;
    const [fila] = await obtenerDb()
      .update(usuarios)
      .set({
        intentosFallidos: sql`case when ${llegaAlMaximo} then 0 else ${usuarios.intentosFallidos} + 1 end`,
        bloqueadoHasta: sql`case when ${llegaAlMaximo} then now() + make_interval(mins => ${minutosBloqueo}) else ${usuarios.bloqueadoHasta} end`,
      })
      .where(eq(usuarios.id, id))
      .returning({ bloqueadoHasta: usuarios.bloqueadoHasta });
    const bloqueadoHasta = fila?.bloqueadoHasta ?? null;
    return bloqueadoHasta && bloqueadoHasta > new Date() ? bloqueadoHasta : null;
  },

  async registrarIngreso(id: string): Promise<void> {
    await obtenerDb()
      .update(usuarios)
      .set({ intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() })
      .where(eq(usuarios.id, id));
  },
};
