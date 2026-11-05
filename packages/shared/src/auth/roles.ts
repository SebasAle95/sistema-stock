/**
 * ROLES Y PERMISOS
 *
 * Los roles los asigna el administrador. Cada pantalla o acción del sistema se
 * protege con un permiso (no con un rol), así agregar un rol nuevo es sumarlo
 * acá y decidir qué permisos tiene, sin tocar el resto del código.
 *
 * La API es la que realmente controla los permisos; la web solo los usa para
 * mostrar u ocultar opciones.
 */

export const ROLES = ['administrador', 'vendedor'] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_ADMINISTRADOR: Rol = 'administrador';

export const nombresDeRoles: Record<Rol, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
};

export const descripcionesDeRoles: Record<Rol, string> = {
  administrador: 'Acceso total: usuarios, caja, estadísticas y configuración.',
  vendedor: 'Vende, consulta productos e ingresa mercadería. No ve costos, la caja general ni las estadísticas.',
};

/** Permiso → roles que lo tienen. Cada módulo nuevo suma sus permisos acá. */
const permisos = {
  'usuarios.gestionar': ['administrador'],
  /** Crear y editar productos, precios y categorías. */
  'productos.gestionar': ['administrador'],
  /** Ver precios de costo, márgenes y ganancias. */
  'productos.ver_costos': ['administrador'],
  /** Cargar la mercadería que llega (sumar stock). */
  'stock.ingresar': ['administrador', 'vendedor'],
  /** Corregir el stock contado y registrar mermas (vencidos, rotos). */
  'stock.ajustar': ['administrador'],
  /** Ver el historial de movimientos de stock. */
  'stock.ver_historial': ['administrador'],
  /** Usar la pantalla de venta. */
  'ventas.registrar': ['administrador', 'vendedor'],
  /** Anular ventas (devuelve el stock). */
  'ventas.anular': ['administrador'],
  /** Ver ventas de todas las cajas (el vendedor solo ve las de la caja abierta). */
  'ventas.ver_todas': ['administrador'],
  /** Abrir caja, registrar ingresos/egresos de efectivo y cerrarla (cierre ciego). */
  'caja.operar': ['administrador', 'vendedor'],
  /** Ver totales, efectivo esperado, diferencias e historial de cajas. */
  'caja.ver_totales': ['administrador'],
} as const satisfies Record<string, readonly Rol[]>;

export type Permiso = keyof typeof permisos;

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return (permisos[permiso] as readonly Rol[]).includes(rol);
}
