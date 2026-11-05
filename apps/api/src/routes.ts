import { Router } from 'express';
import { requiereSesion } from './middlewares/autenticacion';
import { authRoutes } from './modules/auth/auth.routes';
import { cajaRoutes } from './modules/caja/caja.routes';
import { categoriasRoutes } from './modules/categorias/categorias.routes';
import { healthRoutes } from './modules/health/health.routes';
import { productosRoutes } from './modules/productos/productos.routes';
import { stockRoutes } from './modules/stock/stock.routes';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes';
import { ventasRoutes } from './modules/ventas/ventas.routes';

/** Registro central de módulos. Cada módulo nuevo se suma con una línea. */
export const rutas = Router();

// --- Rutas públicas ---
rutas.use('/health', healthRoutes);
rutas.use('/auth', authRoutes); // el login es público; el resto de /auth pide sesión adentro

// ⚠️ Todo lo que se registre debajo de esta línea exige una sesión válida.
rutas.use(requiereSesion());

rutas.use('/usuarios', usuariosRoutes);
rutas.use('/categorias', categoriasRoutes);
rutas.use('/productos', productosRoutes);
rutas.use('/stock', stockRoutes);
rutas.use('/caja', cajaRoutes);
rutas.use('/ventas', ventasRoutes);
