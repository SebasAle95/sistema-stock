/**
 * DATOS DE EJEMPLO
 *
 * Carga 30 días de actividad simulada de la cantina para conocer el sistema:
 * productos, ingresos de mercadería, ventas, cajas, mermas, ajustes y estadísticas.
 *
 *   npm run demo:cargar   → carga el ejemplo (solo si no está cargado)
 *   npm run demo:borrar   → borra todo lo de ejemplo; tus usuarios y lo que cargaste vos quedan
 *
 * Todo lo de ejemplo se identifica por:
 * - los usuarios `demo.vendedor` y `demo.encargado`, autores de cada venta, caja y movimiento;
 * - los códigos de barras que empiezan con "20" (rango reservado para uso interno:
 *   nunca coinciden con productos reales) y los productos de ejemplo sin código.
 */
import {
  hoyEnNegocio,
  MEDIO_EFECTIVO,
  negocio,
  normalizarParaBusqueda,
  sumarDias,
  type TipoMovimientoCaja,
  type TipoMovimientoStock,
} from '@stock/shared';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, inArray, isNull, notExists, or, sql } from 'drizzle-orm';
import { cerrarConexion, obtenerDb } from '../db/client';
import {
  cajas,
  categorias,
  movimientosCaja,
  movimientosStock,
  productos,
  usuarios,
  ventaItems,
  ventas,
} from '../db/schema';
import { hashearPassword } from '../modules/auth/password';

const DIAS = 30;
const USUARIO_VENDEDOR = 'demo.vendedor';
const USUARIO_ENCARGADO = 'demo.encargado';

// ---------------------------------------------------------------------------
// Catálogo de ejemplo
// ---------------------------------------------------------------------------

interface ProductoDemo {
  /** Índice para el código interno (null = sin código). */
  codigo: number | null;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stockInicial: number;
  minimo: number;
  /** Unidades por bulto al reponer. */
  bulto: number;
  /** Peso relativo en las ventas. */
  popularidad: number;
  controlaStock?: boolean;
  rapido?: boolean;
  activo?: boolean;
  /** Deja de reponerse en los últimos N días (para que aparezca la alerta de stock bajo). */
  sinReponerUltimosDias?: number;
  /** Se puede llevar de a más unidades por venta. */
  maxPorVenta?: number;
}

const CATEGORIAS = ['Bebidas', 'Golosinas', 'Snacks', 'Cafetería'] as const;

const CATALOGO: ProductoDemo[] = [
  { codigo: 1, nombre: 'Coca-Cola 500 ml', categoria: 'Bebidas', precio: 1800, costo: 1050, stockInicial: 36, minimo: 12, bulto: 12, popularidad: 10, maxPorVenta: 3 },
  { codigo: 2, nombre: 'Coca-Cola Zero 500 ml', categoria: 'Bebidas', precio: 1800, costo: 1050, stockInicial: 24, minimo: 6, bulto: 12, popularidad: 5 },
  { codigo: 3, nombre: 'Sprite 500 ml', categoria: 'Bebidas', precio: 1700, costo: 1000, stockInicial: 24, minimo: 6, bulto: 12, popularidad: 4 },
  { codigo: 4, nombre: 'Agua mineral 500 ml', categoria: 'Bebidas', precio: 1200, costo: 600, stockInicial: 36, minimo: 12, bulto: 12, popularidad: 8, maxPorVenta: 3 },
  { codigo: 5, nombre: 'Agua saborizada 500 ml', categoria: 'Bebidas', precio: 1500, costo: 850, stockInicial: 18, minimo: 6, bulto: 6, popularidad: 4 },
  { codigo: 6, nombre: 'Gatorade 500 ml', categoria: 'Bebidas', precio: 2500, costo: 1500, stockInicial: 18, minimo: 6, bulto: 6, popularidad: 6, sinReponerUltimosDias: 9 },
  { codigo: 7, nombre: 'Cerveza lata 473 ml', categoria: 'Bebidas', precio: 2800, costo: 1700, stockInicial: 48, minimo: 12, bulto: 24, popularidad: 7, maxPorVenta: 4 },
  { codigo: 8, nombre: 'Alfajor triple', categoria: 'Golosinas', precio: 1500, costo: 850, stockInicial: 24, minimo: 8, bulto: 12, popularidad: 6 },
  { codigo: 9, nombre: 'Alfajor simple', categoria: 'Golosinas', precio: 900, costo: 500, stockInicial: 24, minimo: 8, bulto: 12, popularidad: 5 },
  { codigo: 10, nombre: 'Chocolate 100 g', categoria: 'Golosinas', precio: 2200, costo: 1300, stockInicial: 12, minimo: 4, bulto: 6, popularidad: 2 },
  { codigo: 11, nombre: 'Chicle', categoria: 'Golosinas', precio: 600, costo: 300, stockInicial: 40, minimo: 10, bulto: 20, popularidad: 3 },
  { codigo: 12, nombre: 'Papas fritas 45 g', categoria: 'Snacks', precio: 2000, costo: 1150, stockInicial: 24, minimo: 6, bulto: 12, popularidad: 4 },
  { codigo: 13, nombre: 'Maní salado 120 g', categoria: 'Snacks', precio: 1300, costo: 700, stockInicial: 18, minimo: 6, bulto: 12, popularidad: 3, sinReponerUltimosDias: 10 },
  { codigo: 14, nombre: 'Helado palito (temporada)', categoria: 'Golosinas', precio: 2000, costo: 1100, stockInicial: 0, minimo: 0, bulto: 12, popularidad: 0, activo: false },
  { codigo: null, nombre: 'Café', categoria: 'Cafetería', precio: 1500, costo: 350, stockInicial: 0, minimo: 0, bulto: 1, popularidad: 4, controlaStock: false, rapido: true },
  { codigo: null, nombre: 'Café con leche', categoria: 'Cafetería', precio: 1800, costo: 450, stockInicial: 0, minimo: 0, bulto: 1, popularidad: 3, controlaStock: false, rapido: true },
  { codigo: null, nombre: 'Tostado de jamón y queso', categoria: 'Cafetería', precio: 3500, costo: 1600, stockInicial: 0, minimo: 0, bulto: 1, popularidad: 4, controlaStock: false, rapido: true },
  { codigo: null, nombre: 'Sándwich de miga', categoria: 'Cafetería', precio: 2500, costo: 1200, stockInicial: 0, minimo: 0, bulto: 1, popularidad: 3, controlaStock: false, rapido: true },
];

/** EAN-13 interno: prefijo 20 (uso interno) + número + dígito verificador. */
function codigoInterno(indice: number): string {
  const base = `2000000000${String(indice).padStart(2, '0')}`;
  const suma = [...base].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return base + ((10 - (suma % 10)) % 10);
}

const CODIGOS_DEMO = CATALOGO.filter((p) => p.codigo !== null).map((p) => codigoInterno(p.codigo as number));
const NOMBRES_SIN_CODIGO = CATALOGO.filter((p) => p.codigo === null).map((p) => p.nombre);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Aleatorio con semilla: el ejemplo sale igual cada vez que se carga. */
function generador(semilla: number) {
  let a = semilla;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: siguiente,
    entero: (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1)),
    elegirPonderado<T>(items: T[], peso: (item: T) => number): T | undefined {
      const total = items.reduce((s, i) => s + peso(i), 0);
      let r = siguiente() * total;
      for (const item of items) {
        r -= peso(item);
        if (r <= 0) return item;
      }
      return items.at(-1);
    },
  };
}

/** Fecha y hora "local del negocio" → instante real (sirve aunque la zona tenga horario de verano). */
function fechaLocal(fecha: string, hora: number, minuto: number): Date {
  const comoUtc = Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)), hora, minuto);
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: negocio.zonaHoraria,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(comoUtc));
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const vistoEnLaZona = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'));
  return new Date(comoUtc - (vistoEnLaZona - comoUtc));
}

const minutos = (fecha: Date, m: number) => new Date(fecha.getTime() + m * 60_000);
const redondear = (n: number) => Math.round(n * 100) / 100;

/** Inserta en tandas (Postgres admite hasta 65.535 parámetros por consulta). */
async function insertarEnTandas<T>(insertar: (filas: T[]) => Promise<unknown>, filas: T[], tamaño = 400) {
  for (let i = 0; i < filas.length; i += tamaño) await insertar(filas.slice(i, i + tamaño));
}

// ---------------------------------------------------------------------------
// Cargar
// ---------------------------------------------------------------------------

async function cargar() {
  const db = obtenerDb();
  const existentes = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(inArray(usuarios.usuario, [USUARIO_VENDEDOR, USUARIO_ENCARGADO]));
  if (existentes.length > 0) {
    throw new Error('El ejemplo ya está cargado. Para volver a cargarlo, corré primero "npm run demo:borrar".');
  }

  const azar = generador(2026);
  const hoy = hoyEnNegocio();
  const primerDia = sumarDias(hoy, -DIAS);

  // --- Usuarios de ejemplo ---
  const passwordVendedor = `Demo${randomBytes(3).toString('hex')}`;
  const vendedorId = randomUUID();
  const encargadoId = randomUUID();

  // --- Categorías y productos ---
  const categoriaIds = new Map(CATEGORIAS.map((c) => [c, randomUUID()]));
  const catalogo = CATALOGO.map((p) => ({
    ...p,
    id: randomUUID(),
    codigoBarras: p.codigo === null ? null : codigoInterno(p.codigo),
    controlaStock: p.controlaStock ?? true,
    activo: p.activo ?? true,
    stock: 0,
  }));

  // --- Simulación, en orden cronológico ---
  type Mov = typeof movimientosStock.$inferInsert;
  const movStock: Mov[] = [];
  const filasCajas: (typeof cajas.$inferInsert)[] = [];
  const filasVentas: (typeof ventas.$inferInsert)[] = [];
  const filasItems: (typeof ventaItems.$inferInsert)[] = [];
  const filasMovCaja: (typeof movimientosCaja.$inferInsert)[] = [];

  function moverStock(
    p: (typeof catalogo)[number],
    tipo: TipoMovimientoStock,
    cantidad: number,
    usuarioId: string,
    creadoEn: Date,
    extra: Partial<Mov> = {},
  ) {
    p.stock += cantidad;
    movStock.push({ id: randomUUID(), productoId: p.id, tipo, cantidad, stockResultante: p.stock, usuarioId, creadoEn, ...extra });
  }

  let remito = 120;
  let ultimoAcceso = new Date(0);

  for (let i = 0; i < DIAS; i++) {
    const dia = sumarDias(primerDia, i);
    const diaSemana = new Date(`${dia}T12:00:00Z`).getUTCDay(); // 0 domingo … 6 sábado
    const finDeSemana = diaSemana === 0 || diaSemana === 5 || diaSemana === 6;
    const diasQueFaltan = DIAS - i;

    // Primer día: stock inicial cargado por el encargado.
    if (i === 0) {
      for (const p of catalogo.filter((x) => x.controlaStock && x.stockInicial > 0)) {
        moverStock(p, 'inicial', p.stockInicial, encargadoId, fechaLocal(dia, 9, 30), { costoUnitario: p.costo });
      }
    }

    // Reposición: cada 4 días llega el proveedor y se repone lo que está bajo.
    if (i > 0 && i % 4 === 1) {
      const actor = i % 8 === 1 ? encargadoId : vendedorId; // el vendedor también puede ingresar (sin costo)
      const conCosto = actor === encargadoId;
      for (const proveedor of ['Distribuidora Sur', 'Mayorista El Puente']) {
        const nota = `${proveedor} · remito 0001-${String(remito++).padStart(5, '0')}`;
        const hora = proveedor === 'Distribuidora Sur' ? 11 : 12;
        for (const p of catalogo) {
          const esDelProveedor = (p.categoria === 'Bebidas') === (proveedor === 'Distribuidora Sur');
          if (!p.controlaStock || !p.activo || !esDelProveedor) continue;
          if (p.sinReponerUltimosDias && diasQueFaltan <= p.sinReponerUltimosDias) continue;
          if (p.stock >= p.minimo * 2) continue;
          const cantidad = Math.ceil((p.minimo * 3 - p.stock) / p.bulto) * p.bulto;
          moverStock(p, 'ingreso', cantidad, actor, fechaLocal(dia, hora, azar.entero(0, 40)), {
            costoUnitario: conCosto ? p.costo : null,
            nota,
          });
        }
      }
    }

    // Una merma y un ajuste por conteo, hechos por el encargado.
    if (i === 12) {
      const alfajor = catalogo.find((p) => p.nombre === 'Alfajor simple');
      if (alfajor && alfajor.stock >= 3) {
        moverStock(alfajor, 'merma', -3, encargadoId, fechaLocal(dia, 12, 15), { nota: 'Vencido: lote con fecha pasada' });
      }
    }
    if (i === 20) {
      const chocolate = catalogo.find((p) => p.nombre === 'Chocolate 100 g');
      if (chocolate && chocolate.stock >= 2) {
        moverStock(chocolate, 'ajuste', -2, encargadoId, fechaLocal(dia, 12, 30), { nota: 'Conteo semanal: había 2 menos' });
      }
    }

    // --- Turno de caja ---
    const cajaId = randomUUID();
    const abreElEncargado = diaSemana === 1; // los lunes abre el encargado
    const responsable = abreElEncargado ? encargadoId : vendedorId;
    const apertura = fechaLocal(dia, finDeSemana ? 14 : 17, finDeSemana ? 0 : 30);
    const cierre = fechaLocal(dia, 23, 45);
    const montoInicial = 10_000;
    let efectivoVentas = 0;
    let ingresos = 0;
    let egresos = 0;

    // Horarios: la noche es el pico (partidos después del trabajo).
    const horasPosibles = finDeSemana ? [14, 15, 16, 17, 18, 19, 20, 21, 22, 23] : [18, 19, 20, 21, 22, 23];
    const pesoHora = (h: number) => ({ 14: 2, 15: 2, 16: 3, 17: 3, 18: 4, 19: 6, 20: 8, 21: 9, 22: 7, 23: 3 })[h] ?? 1;
    const cantidadVentas = finDeSemana ? azar.entero(28, 40) : azar.entero(10, 18);
    const horarios = Array.from({ length: cantidadVentas }, () => {
      const hora = azar.elegirPonderado(horasPosibles, pesoHora) ?? 20;
      const enElMinuto = fechaLocal(dia, hora, azar.entero(0, hora === 23 ? 35 : 59));
      return new Date(enElMinuto.getTime() + azar.entero(0, 59) * 1000);
    }).sort((a, b) => a.getTime() - b.getTime());
    // Dos ventas nunca en el mismo instante: así el historial de stock queda en un orden único.
    for (let k = 1; k < horarios.length; k++) {
      const anterior = horarios[k - 1] as Date;
      if ((horarios[k] as Date).getTime() <= anterior.getTime()) horarios[k] = new Date(anterior.getTime() + 1000);
    }

    const ventasDelDia: { id: string; total: number; medio: string; creadoEn: Date }[] = [];
    for (const [indice, creadoEn] of horarios.entries()) {
      const disponibles = catalogo.filter((p) => p.activo && p.popularidad > 0 && (!p.controlaStock || p.stock > 0));
      const cantidadProductos = azar.numero() < 0.55 ? 1 : azar.numero() < 0.75 ? 2 : 3;
      const elegidos: { p: (typeof catalogo)[number]; cantidad: number }[] = [];
      for (let k = 0; k < cantidadProductos; k++) {
        const candidatos = disponibles.filter((p) => !elegidos.some((e) => e.p.id === p.id));
        const p = azar.elegirPonderado(candidatos, (x) => x.popularidad);
        if (!p) break;
        let cantidad = azar.numero() < 0.75 ? 1 : azar.entero(2, p.maxPorVenta ?? 2);
        if (p.controlaStock) cantidad = Math.min(cantidad, p.stock);
        if (cantidad > 0) elegidos.push({ p, cantidad });
      }
      if (elegidos.length === 0) continue;

      const ventaId = randomUUID();
      const total = redondear(elegidos.reduce((s, e) => s + e.p.precio * e.cantidad, 0));
      const r = azar.numero();
      const medio = r < 0.55 ? MEDIO_EFECTIVO : r < 0.85 ? 'mercado_pago' : 'transferencia';
      let montoRecibido: number | null = null;
      if (medio === MEDIO_EFECTIVO) {
        const billetes = [total, Math.ceil(total / 1000) * 1000, 5000, 10_000, 20_000].filter((b) => b >= total);
        montoRecibido = azar.numero() < 0.45 ? total : (billetes[azar.entero(1, Math.min(2, billetes.length - 1))] ?? total);
        efectivoVentas += total;
      }

      filasVentas.push({
        id: ventaId,
        cajaId,
        usuarioId: responsable,
        total,
        medioPago: medio,
        montoRecibido,
        vuelto: montoRecibido === null ? null : redondear(montoRecibido - total),
        creadoEn,
      });
      for (const { p, cantidad } of elegidos) {
        filasItems.push({
          id: randomUUID(),
          ventaId,
          productoId: p.id,
          nombre: p.nombre,
          cantidad,
          precioUnitario: p.precio,
          costoUnitario: p.costo,
          subtotal: redondear(p.precio * cantidad),
        });
        if (p.controlaStock) moverStock(p, 'venta', -cantidad, responsable, creadoEn, { ventaId });
      }
      ventasDelDia.push({ id: ventaId, total, medio, creadoEn });

      // Una venta anulada por el encargado (se cobró dos veces). Se anula enseguida,
      // antes de la venta siguiente, para que el historial de stock quede en orden.
      if (i === 15 && ventasDelDia.length === 3) {
        const siguiente = horarios[indice + 1];
        const anuladaEn = new Date(
          Math.min(minutos(creadoEn, 2).getTime(), (siguiente ?? minutos(creadoEn, 10)).getTime() - 1000),
        );
        const fila = filasVentas.at(-1);
        if (fila) {
          fila.anulada = true;
          fila.anuladaPor = encargadoId;
          fila.anuladaEn = anuladaEn;
          fila.motivoAnulacion = 'Se cobró dos veces';
        }
        if (medio === MEDIO_EFECTIVO) efectivoVentas -= total;
        for (const { p, cantidad } of elegidos.filter((e) => e.p.controlaStock)) {
          moverStock(p, 'anulacion_venta', cantidad, encargadoId, anuladaEn, { ventaId, nota: 'Se cobró dos veces' });
        }
      }
    }

    // Entradas y salidas de efectivo que no son ventas.
    const movimientosDelDia: { tipo: TipoMovimientoCaja; monto: number; motivo: string; hora: number }[] = [];
    if (azar.numero() < 0.4) movimientosDelDia.push({ tipo: 'egreso', monto: azar.entero(6, 9) * 500, motivo: 'Bolsas de hielo', hora: 19 });
    if (i % 10 === 4) movimientosDelDia.push({ tipo: 'egreso', monto: 5200, motivo: 'Artículos de limpieza', hora: 18 });
    if (i % 11 === 6) movimientosDelDia.push({ tipo: 'ingreso', monto: 5000, motivo: 'Cambio que trajo el dueño', hora: 18 });
    for (const m of movimientosDelDia) {
      filasMovCaja.push({
        id: randomUUID(),
        cajaId,
        tipo: m.tipo,
        monto: m.monto,
        motivo: m.motivo,
        usuarioId: responsable,
        creadoEn: fechaLocal(dia, m.hora, azar.entero(0, 50)),
      });
      if (m.tipo === 'egreso') egresos += m.monto;
      else ingresos += m.monto;
    }

    // Cierre (ciego): la mayoría justos, algunos con faltante o sobrante.
    const efectivoEsperado = redondear(montoInicial + efectivoVentas + ingresos - egresos);
    const r = azar.numero();
    const diferencia = r < 0.7 ? 0 : r < 0.85 ? -azar.entero(1, 2) * 500 : azar.entero(1, 3) * 100;
    const notaCierre =
      diferencia < 0 ? 'Faltó plata: posible vuelto de más' : diferencia > 0 ? 'Sobró: propina sin registrar' : null;
    filasCajas.push({
      id: cajaId,
      abiertaPor: responsable,
      abiertaEn: apertura,
      montoInicial,
      cerradaPor: responsable,
      cerradaEn: cierre,
      efectivoEsperado,
      efectivoContado: redondear(efectivoEsperado + diferencia),
      diferencia,
      notaCierre,
    });
    if (responsable === vendedorId) ultimoAcceso = cierre;
  }

  // --- Guardar todo en una sola transacción ---
  const ahora = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(usuarios).values([
      {
        id: vendedorId,
        nombre: 'Vendedor de ejemplo',
        usuario: USUARIO_VENDEDOR,
        passwordHash: await hashearPassword(passwordVendedor),
        rol: 'vendedor',
        debeCambiarPassword: false,
        ultimoAcceso,
      },
      {
        id: encargadoId,
        nombre: 'Encargado de ejemplo',
        usuario: USUARIO_ENCARGADO,
        // Contraseña aleatoria que nadie conoce y usuario desactivado: no se puede usar para entrar.
        passwordHash: await hashearPassword(randomBytes(24).toString('base64url').slice(0, 60)),
        rol: 'administrador',
        activo: false,
        debeCambiarPassword: false,
      },
    ]);
    await tx.insert(categorias).values(CATEGORIAS.map((nombre) => ({ id: categoriaIds.get(nombre), nombre })));
    await tx.insert(productos).values(
      catalogo.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        nombreBusqueda: normalizarParaBusqueda(p.nombre),
        codigoBarras: p.codigoBarras,
        categoriaId: categoriaIds.get(p.categoria as (typeof CATEGORIAS)[number]) ?? null,
        precioVenta: p.precio,
        precioCosto: p.costo,
        stock: p.stock,
        stockMinimo: p.minimo,
        controlaStock: p.controlaStock,
        accesoRapido: p.rapido ?? false,
        activo: p.activo,
        creadoEn: fechaLocal(primerDia, 9, 0),
      })),
    );
    // Cajas y ventas en orden de fecha: así sus números (#1, #2…) quedan correlativos.
    await insertarEnTandas((f) => tx.insert(cajas).values(f), filasCajas);
    await insertarEnTandas((f) => tx.insert(ventas).values(f), filasVentas);
    await insertarEnTandas((f) => tx.insert(ventaItems).values(f), filasItems);
    await insertarEnTandas(
      (f) => tx.insert(movimientosStock).values(f),
      movStock.sort((a, b) => (a.creadoEn as Date).getTime() - (b.creadoEn as Date).getTime()),
    );
    await insertarEnTandas((f) => tx.insert(movimientosCaja).values(f), filasMovCaja);
  });

  const bajos = catalogo.filter((p) => p.controlaStock && p.activo && p.stock <= p.minimo).map((p) => `${p.nombre} (${p.stock})`);
  console.log(`
✅ Ejemplo cargado (${((Date.now() - ahora.getTime()) / 1000).toFixed(1)} s)
   ${catalogo.length} productos en ${CATEGORIAS.length} categorías · ${filasCajas.length} cajas cerradas
   ${filasVentas.length} ventas · ${movStock.length} movimientos de stock · ${filasMovCaja.length} entradas/salidas de efectivo
   Con stock bajo: ${bajos.join(', ') || 'ninguno'}

👤 Para ver el sistema como vendedor:
   usuario: ${USUARIO_VENDEDOR}
   contraseña: ${passwordVendedor}
   (no queda guardada en ningún lado: anotala ahora)

🧹 Para sacar todo lo de ejemplo: npm run demo:borrar
`);
}

// ---------------------------------------------------------------------------
// Borrar
// ---------------------------------------------------------------------------

async function borrar() {
  const db = obtenerDb();
  const resumen = await db.transaction(async (tx) => {
    const demo = await tx
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(inArray(usuarios.usuario, [USUARIO_VENDEDOR, USUARIO_ENCARGADO]));
    if (demo.length === 0) return null;
    const ids = demo.map((u) => u.id);
    const ventasDemo = tx.select({ id: ventas.id }).from(ventas).where(inArray(ventas.usuarioId, ids));

    const movStock = await tx
      .delete(movimientosStock)
      .where(or(inArray(movimientosStock.usuarioId, ids), inArray(movimientosStock.ventaId, ventasDemo)))
      .returning({ id: movimientosStock.id });
    const ventasBorradas = await tx.delete(ventas).where(inArray(ventas.usuarioId, ids)).returning({ id: ventas.id });
    const movCaja = await tx.delete(movimientosCaja).where(inArray(movimientosCaja.usuarioId, ids)).returning({ id: movimientosCaja.id });
    const cajasBorradas = await tx
      .delete(cajas)
      .where(
        and(
          inArray(cajas.abiertaPor, ids),
          notExists(tx.select({ id: ventas.id }).from(ventas).where(eq(ventas.cajaId, cajas.id))),
          notExists(tx.select({ id: movimientosCaja.id }).from(movimientosCaja).where(eq(movimientosCaja.cajaId, cajas.id))),
        ),
      )
      .returning({ id: cajas.id });

    // Productos de ejemplo que nadie más usó (si vendiste o ingresaste alguno vos, se conserva).
    const sinUso = and(
      notExists(tx.select({ id: movimientosStock.id }).from(movimientosStock).where(eq(movimientosStock.productoId, productos.id))),
      notExists(tx.select({ id: ventaItems.id }).from(ventaItems).where(eq(ventaItems.productoId, productos.id))),
    );
    const productosBorrados = await tx
      .delete(productos)
      .where(
        and(
          or(
            inArray(productos.codigoBarras, CODIGOS_DEMO),
            and(isNull(productos.codigoBarras), inArray(productos.nombre, NOMBRES_SIN_CODIGO)),
          ),
          sinUso,
        ),
      )
      .returning({ nombre: productos.nombre });
    // Los que se conservan quedan con el stock de sus propios movimientos (sin los del ejemplo),
    // así el stock sigue coincidiendo con su historial.
    const productosConservados = await tx
      .update(productos)
      .set({
        stock: sql`(select coalesce(sum(${movimientosStock.cantidad}), 0) from ${movimientosStock} where ${movimientosStock.productoId} = ${productos.id})`,
      })
      .where(
        or(inArray(productos.codigoBarras, CODIGOS_DEMO), and(isNull(productos.codigoBarras), inArray(productos.nombre, NOMBRES_SIN_CODIGO))),
      )
      .returning({ nombre: productos.nombre, stock: productos.stock, controlaStock: productos.controlaStock });

    const categoriasBorradas = await tx
      .delete(categorias)
      .where(
        and(
          inArray(categorias.nombre, [...CATEGORIAS]),
          notExists(tx.select({ id: productos.id }).from(productos).where(eq(productos.categoriaId, categorias.id))),
        ),
      )
      .returning({ id: categorias.id });

    await tx.delete(usuarios).where(inArray(usuarios.id, ids));

    // Si no quedó ninguna venta ni caja, la numeración vuelve a empezar en 1.
    const [quedan] = await tx.execute<{ ventas: number; cajas: number }>(
      sql`select (select count(*) from ventas)::int as ventas, (select count(*) from cajas)::int as cajas`,
    );
    if (quedan?.ventas === 0) await tx.execute(sql`alter table ventas alter column numero restart with 1`);
    if (quedan?.cajas === 0) await tx.execute(sql`alter table cajas alter column numero restart with 1`);

    return {
      ventas: ventasBorradas.length,
      cajas: cajasBorradas.length,
      movStock: movStock.length,
      movCaja: movCaja.length,
      productos: productosBorrados.length,
      categorias: categoriasBorradas.length,
      conservados: productosConservados.map((p) => (p.controlaStock ? `${p.nombre} (stock ${p.stock})` : p.nombre)),
    };
  });

  if (!resumen) {
    console.log('\nNo hay datos de ejemplo cargados.\n');
    return;
  }
  console.log(`
🧹 Ejemplo borrado
   ${resumen.ventas} ventas · ${resumen.cajas} cajas · ${resumen.movStock} movimientos de stock · ${resumen.movCaja} entradas/salidas
   ${resumen.productos} productos · ${resumen.categorias} categorías · 2 usuarios de ejemplo
${
  resumen.conservados.length
    ? `   Se conservaron porque se usaron fuera del ejemplo: ${resumen.conservados.join(', ')}.\n` +
      '   Quedaron con el stock de tus propios movimientos: contalos y corregilos con "Ajustar stock".\n'
    : ''
}   Tus usuarios y todo lo que cargaste vos quedaron intactos.
`);
}

// ---------------------------------------------------------------------------

const comando = process.argv[2];
const acciones: Record<string, () => Promise<void>> = { cargar, borrar };
const accion = comando ? acciones[comando] : undefined;

if (!accion) {
  console.error('Uso: npm run demo:cargar  |  npm run demo:borrar');
  process.exitCode = 1;
} else {
  accion()
    .catch((error: unknown) => {
      console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    })
    .finally(() => cerrarConexion());
}
