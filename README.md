<p align="center">
  <img src="apps/web/public/la-frontera.png" alt="La Frontera Fútbol 5" width="120" />
</p>

<h1 align="center">Sistema de stock y cantina — La Frontera Fútbol 5</h1>

<p align="center">
  Punto de venta y control de stock para la cantina de la cancha: venta con lector de código de barras,
  caja con cierre ciego, ingreso de mercadería, estadísticas y usuarios con roles.
</p>

---

## Contenido

1. [Qué hace el sistema](#qué-hace-el-sistema)
2. [Un turno en la cantina, paso a paso](#un-turno-en-la-cantina-paso-a-paso)
3. [Roles: qué puede hacer cada uno](#roles-qué-puede-hacer-cada-uno)
4. [Seguridad](#seguridad)
5. [Tecnología y arquitectura](#tecnología-y-arquitectura)
6. [Base de datos](#base-de-datos)
7. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
8. [Comandos](#comandos)
9. [Estructura del proyecto](#estructura-del-proyecto)
10. [API](#api)
11. [Cómo agregar un módulo](#cómo-agregar-un-módulo)
12. [Personalizar o reutilizar para otro negocio](#personalizar-o-reutilizar-para-otro-negocio)
13. [Ramas y flujo de trabajo](#ramas-y-flujo-de-trabajo)

---

## Qué hace el sistema

Es una aplicación web que corre en la compu de la cantina. Cada persona entra con su propio usuario, y lo que ve depende de su rol.

| Pantalla | Para qué sirve |
|---|---|
| **Inicio** | Productos con stock bajo y estado del sistema (API y base de datos). |
| **Vender** | Pantalla de cobro: se pasa la pistola o se toca un botón rápido, se arma el carrito y se cobra. |
| **Ventas** | Listado de ventas con su detalle. El administrador puede anular. |
| **Caja** | Abrir la caja, registrar entradas y salidas de efectivo y cerrarla al final del turno. |
| **Historial de cajas** | Cada turno cerrado: cuánto se vendió, cuánto debía haber, cuánto se contó y la diferencia. |
| **Estadísticas** | Recaudación, ganancia, ventas, ticket promedio, horarios pico, medios de pago y productos más vendidos. |
| **Productos** | Alta y edición de productos y categorías, con precio de venta, costo y stock mínimo. |
| **Ingreso de mercadería** | Cargar lo que trajo el proveedor pasando la pistola por cada producto. |
| **Movimientos de stock** | Historial de cada cambio de stock: qué, cuánto, quién y cuándo. |
| **Usuarios** | Alta de usuarios, roles, restablecer contraseñas y desactivar cuentas. |

### Productos y lector de código de barras

- **La pistola funciona en cualquier momento**, sin hacer clic en ningún campo. Si el código existe, el producto se abre; si no, se da de alta con el código ya cargado. La carga inicial es pasar la pistola por cada producto y completar nombre y precio.
- **Productos sin código** (café, sándwich, porciones): se buscan por nombre o se marcan como **botón rápido** para la pantalla de venta.
- **Control de stock opcional:** lo que se prepara en el momento no lleva stock ni genera alertas.
- **Precio de costo:** solo lo ve el administrador. Al cargarlo, el sistema muestra la ganancia por unidad.
- **Búsqueda tolerante:** "cafe" encuentra "Café con leche" y "coca 500" encuentra "Coca-Cola 500 ml".
- **Precios en formato argentino:** se puede escribir `1.500`, `1500` o `1500,50`.

> La lectora USB funciona como un teclado: escribe el código y aprieta Enter. Tiene que estar configurada para mandar Enter al final; la mayoría viene así de fábrica.

### Stock

- **El stock no se edita a mano.** Cambia solo con movimientos: stock inicial, ingreso de mercadería, venta, ajuste, merma o anulación de venta. Cada movimiento queda registrado con quién lo hizo y cuándo.
- **Ingreso de mercadería:** se pasa la pistola por todo lo que llegó (escanear dos veces suma una unidad), se ajustan las cantidades y se confirma todo junto. Se puede anotar el proveedor o el número de remito. El administrador además carga el costo de la compra.
- **Ajustes y mermas** (solo administrador): "Conté el stock" corrige al número real; "Merma" descuenta unidades vencidas, rotas o de consumo interno, con el motivo.
- **Alerta de stock bajo** en Inicio, con acceso directo a la lista filtrada.

### Ventas

- **Carrito** con la pistola, el buscador o los botones rápidos; las cantidades se cambian con + y −.
- **Cobro** en efectivo, transferencia o Mercado Pago. En efectivo calcula el vuelto, con botones para los billetes más comunes.
- **Precios seguros:** los pone el servidor, nunca el navegador. Cada venta guarda el precio y el costo de ese momento, así la ganancia de ayer no cambia si mañana sube un costo.
- **Si el sistema dice 0 pero el producto está en la mano**, se puede vender igual: el stock queda en negativo y se avisa, para corregirlo después.
- **Anulación** (solo administrador): únicamente de la caja abierta, con motivo; el stock vuelve a sumarse.

### Caja

- **Una sola caja abierta a la vez**, porque se vende desde una sola compu. No se puede vender con la caja cerrada.
- **Entradas y salidas de efectivo** que no son ventas: pago a un proveedor, retiro, cambio.
- **Cierre ciego:** quien cierra cuenta el efectivo y lo carga sin ver cuánto "debería" haber. El administrador ve el esperado (efectivo inicial + ventas en efectivo + entradas − salidas), lo contado y la diferencia.

### Estadísticas (solo administrador)

- **Períodos:** hoy, 7 días, 30 días, este mes o fechas a elección, siempre en hora de Argentina.
- **Indicadores:** recaudación, ganancia y margen, cantidad de ventas y ticket promedio, comparados con el período anterior de la misma duración.
- **Gráficos:** recaudación por día (o por hora si es un solo día), horarios pico, medios de pago y los 10 productos más vendidos.
- **Accesibles:** cada gráfico muestra los valores al pasar el mouse o con el teclado, tiene una vista de tabla y usa colores aptos para daltonismo en modo claro y oscuro.

### Otros

- **Modo claro y oscuro**, con los colores de La Frontera (azul petróleo y naranja).
- **Funciona en celular y tablet**: el menú se despliega con el botón ☰.

---

## Un turno en la cantina, paso a paso

1. **Abrir la caja.** En *Vender* o *Caja* se carga el efectivo inicial para dar cambio.
2. **Vender.** Pistola o botón rápido, **Cobrar**, elegir el medio de pago y confirmar.
3. **Durante el turno.** Si se paga algo con plata de la caja (por ejemplo, el hielo), se registra en *Caja → Entrada / salida*.
4. **Si llega mercadería.** En *Ingreso de mercadería* se pasa la pistola por cada producto y se confirma.
5. **Cerrar la caja.** Se cuenta el efectivo, se carga y se cierra.
6. **El administrador revisa.** En *Historial de cajas* ve si la caja cerró justa, sobró o faltó, y en *Estadísticas* cómo fue el día.

---

## Roles: qué puede hacer cada uno

No hay registro público: los usuarios los crea un administrador, con una contraseña temporal que cada persona cambia en su primer ingreso. Puede haber varios administradores.

| Acción | Administrador | Vendedor |
|---|:-:|:-:|
| Vender (pistola, buscador, botones rápidos) | ✅ | ✅ |
| Ver ventas | Todas | Solo las de la caja abierta |
| Anular ventas (de la caja abierta, devuelve el stock) | ✅ | ❌ |
| Abrir caja, entradas y salidas de efectivo, cerrar caja | ✅ | ✅ (cierre ciego) |
| Ver efectivo esperado, diferencias e historial de cajas | ✅ | ❌ |
| Consultar productos, precios y stock | ✅ | ✅ |
| Crear y editar productos, precios y categorías; ver costos | ✅ | ❌ |
| Ingreso de mercadería | ✅ (con costo) | ✅ (sin costo) |
| Ajustes de stock, mermas e historial de movimientos | ✅ | ❌ |
| Estadísticas | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |

Los permisos se controlan en la API en cada pedido; la web solo oculta lo que no corresponde. Están definidos en [`packages/shared/src/auth/roles.ts`](packages/shared/src/auth/roles.ts).

---

## Seguridad

| Medida | Detalle |
|---|---|
| Contraseñas | Solo **bcrypt** (costo 12, configurable). Nunca MD5 ni SHA. Mínimo 8 caracteres, con letras y números. Si se sube el costo, los hashes se actualizan solos en el próximo ingreso. |
| Sesiones | Token aleatorio de 256 bits en una cookie `HttpOnly` y `SameSite=Lax` (en producción, además, `Secure` y prefijo `__Host-`). En la base se guarda solo su SHA-256. Duran 12 h y se renuevan mientras se usen. |
| Cerrar sesión | Borra la sesión en la base: la cookie deja de servir aunque alguien la haya copiado. |
| Fuerza bruta | Bloqueo de la cuenta por 15 minutos tras 5 intentos fallidos, más un límite de 20 intentos fallidos cada 15 minutos por IP. |
| Usuarios inexistentes | Mismo mensaje y mismo tiempo de respuesta que una contraseña incorrecta: no se puede averiguar qué usuarios existen. |
| Cambios de cuenta | Al desactivar un usuario o restablecerle la contraseña, sus sesiones se cierran en el momento. |
| Administradores | Nadie puede cambiarse su propio rol ni desactivarse, y siempre queda al menos un administrador activo. |
| CSRF | Cookie `SameSite=Lax`, y la API rechaza pedidos que modifican datos si vienen de otro sitio. |
| Supabase | Todas las tablas tienen RLS activado sin políticas: la API pública de Supabase no puede leerlas. |
| Costos | El precio de costo y las ganancias no se envían a quien no tiene permiso para verlos. |
| Respuestas | `Cache-Control: no-store` y headers de seguridad (Helmet). La API nunca devuelve hashes de contraseñas. |

---

## Tecnología y arquitectura

| Parte | Tecnología |
|---|---|
| Frontend (`apps/web`) | Next.js 16 · React 19 · TypeScript · Material UI 9 |
| API (`apps/api`) | Node 22 · Express 5 · TypeScript · Zod |
| Base de datos | PostgreSQL en Supabase · Drizzle ORM (consultas y migraciones) |
| Compartido (`packages/shared`) | Configuración del negocio, roles y permisos, validaciones, tipos y formatos |

```
Navegador ──► Web (Next.js, :3100) ──/api/*──► API (Express, :4100) ──► PostgreSQL (Supabase)
               └─ proxy.ts: sin cookie → login           └─ sesión, permisos y reglas de negocio
```

- **Web y API separadas**, en un mismo repositorio (npm workspaces). La web reenvía `/api/*` a la API, así que para el navegador son el mismo sitio y la cookie de sesión no es "de terceros".
- **Las validaciones se escriben una sola vez**, con Zod en `packages/shared`, y las usan los formularios y la API.
- **Transacciones:** cada venta, ingreso, ajuste y anulación actualiza el stock y registra su movimiento en la misma transacción. Si algo falla, no queda nada a medias.
- **Fechas:** los días se cuentan en hora de Argentina (`America/Argentina/Buenos_Aires`), aunque el servidor esté en otra zona.
- **Respuesta única de la API:** `{ "ok": true, "data": ... }` o `{ "ok": false, "error": { "codigo", "mensaje", "detalles" } }`.

---

## Base de datos

| Tabla | Qué guarda |
|---|---|
| `usuarios` | Nombre, usuario, hash bcrypt, rol, estado, intentos fallidos y último ingreso. |
| `sesiones` | Sesiones activas (hash del token, vencimiento, IP). |
| `categorias` | Categorías de productos (sin repetidos, sin importar mayúsculas). |
| `productos` | Código de barras, nombre, precios de venta y costo, stock, stock mínimo, control de stock y botón rápido. |
| `movimientos_stock` | Cada cambio de stock: tipo, cantidad, stock resultante, costo, nota, usuario y venta asociada. |
| `cajas` | Turnos de caja: apertura, cierre, efectivo inicial, esperado, contado y diferencia. |
| `movimientos_caja` | Entradas y salidas de efectivo que no son ventas. |
| `ventas` | Ticket, caja, vendedor, total, medio de pago, vuelto y anulación. |
| `venta_items` | Renglones de cada venta, con precio y costo del momento. |

Las tablas se crean **solo con migraciones** (`apps/api/drizzle/`), nunca a mano desde el panel de Supabase.

---

## Instalación y puesta en marcha

Esta sección es para desarrollo, en una compu. Para el servidor (Docker, HTTPS, https://stock.hardhouse.com.ar), ver [docs/despliegue.md](docs/despliegue.md).

### Requisitos

- **Node 22 LTS** o superior, con npm.
- Un proyecto de **Supabase** (u otro PostgreSQL; el sistema se probó con la versión 17).

### 1. Instalar dependencias y crear los archivos de configuración

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Los archivos `.env` no se suben a git.

### 2. Conectar la base de datos

1. En Supabase: botón **Connect** → **Session pooler** → copiar la URI.
2. Pegarla en `apps/api/.env` como `DATABASE_URL=...`, reemplazando `[YOUR-PASSWORD]` por la contraseña. Si la contraseña tiene símbolos (`@ # / : ? %`), van codificados (`%40`, `%23`…).
3. Crear las tablas y el primer administrador:
   ```bash
   npm run db:migrate
   npm run crear-admin
   ```

### 3. Levantar el sistema

```bash
npm run dev
```

- Web: http://localhost:3100
- API: http://localhost:4100/api/health

Los puertos son fijos y distintos de los habituales (3000/4000), para no chocar con otros proyectos abiertos.

### Variables de entorno

**API** (`apps/api/.env`):

| Variable | Por defecto | Qué es |
|---|---|---|
| `DATABASE_URL` | — | Conexión a PostgreSQL (Session pooler de Supabase). Sin ella la API arranca, pero no se puede iniciar sesión. |
| `PORT` | `4100` | Puerto de la API. |
| `CORS_ORIGIN` | `http://localhost:3100` | Orígenes de la web, separados por coma. |
| `SESION_HORAS` | `12` | Duración de la sesión (se renueva mientras se use). |
| `BCRYPT_COSTO` | `12` | Costo de bcrypt (10 a 15). |
| `TRUST_PROXY` | `loopback` | Proxies confiables para conocer la IP real del cliente. |

**Web** (`apps/web/.env.local`):

| Variable | Por defecto | Qué es |
|---|---|---|
| `API_URL` | `http://localhost:4100` | Dirección de la API. Se lee al compilar: en producción hay que definirla antes de `npm run build`. |

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | API y web en modo desarrollo (se recargan solas al guardar). |
| `npm run build` | Compila la API (`apps/api/dist`) y la web (`apps/web/.next`). |
| `npm run start:api` / `npm run start:web` | Ejecuta lo compilado. |
| `npm run typecheck` | Verifica los tipos de TypeScript en todo el repositorio. |
| `npm run lint` | Revisa el código de la web con ESLint. |
| `npm run db:generate` | Genera una migración SQL a partir de los cambios en el esquema. |
| `npm run db:migrate` | Aplica las migraciones pendientes. |
| `npm run db:studio` | Abre Drizzle Studio para ver y editar los datos. |
| `npm run crear-admin` | Crea un administrador desde la terminal (la contraseña no se muestra al escribirla). |
| `npm run demo:cargar` | Carga 30 días de actividad de ejemplo para conocer el sistema (ver abajo). |
| `npm run demo:borrar` | Borra todo lo de ejemplo; tus usuarios y lo que cargaste vos quedan. |

### Datos de ejemplo

`npm run demo:cargar` llena todas las pantallas con un mes simulado de la cantina:

- 18 productos en 4 categorías, con productos sin código y botones rápidos.
- Stock inicial, reposiciones con número de remito, una merma y un ajuste por conteo.
- Un turno de caja por día, con más ventas los fines de semana y a la noche.
- Ventas en efectivo con vuelto, Mercado Pago y transferencia, y una venta anulada.
- Salidas de efectivo y cierres justos, con faltante y con sobrante.
- Dos productos sin stock, para ver la alerta.

Crea el usuario `demo.vendedor` para entrar con el rol de vendedor; la contraseña se muestra una sola vez al cargar. Los productos de ejemplo usan códigos que empiezan con `20`, un rango reservado para uso interno, así que nunca coinciden con productos reales.

**Antes de usar el sistema en serio, corré `npm run demo:borrar`.** Si vendiste o ingresaste algún producto de ejemplo, ese producto se conserva con el stock de tus propios movimientos, para que lo cuentes y lo ajustes.

---

## Estructura del proyecto

```
sistema-stock/
├─ apps/
│  ├─ api/                              → API REST (Express)
│  │  ├─ drizzle/                       → migraciones SQL
│  │  └─ src/
│  │     ├─ config/env.ts               → variables de entorno validadas
│  │     ├─ db/schema/                  → tablas (usuarios, productos, ventas…)
│  │     ├─ middlewares/                → sesión, permisos, seguridad, errores
│  │     ├─ modules/                    → un módulo por funcionalidad
│  │     │  ├─ auth/                    → login, sesiones, contraseñas
│  │     │  ├─ usuarios/
│  │     │  ├─ categorias/
│  │     │  ├─ productos/
│  │     │  ├─ stock/                   → ingresos, ajustes, mermas, movimientos
│  │     │  ├─ caja/
│  │     │  ├─ ventas/
│  │     │  ├─ estadisticas/
│  │     │  └─ health/
│  │     ├─ scripts/crearAdmin.ts
│  │     ├─ utils/                      → respuestas y fechas en hora del negocio
│  │     ├─ routes.ts                   → registro central de módulos
│  │     └─ index.ts
│  └─ web/                              → Frontend (Next.js + Material UI)
│     ├─ public/                        → logo y fondo del login
│     └─ src/
│        ├─ app/
│        │  ├─ login/  cambiar-password/
│        │  └─ (panel)/                 → pantallas con sesión y menú
│        │     ├─ estadisticas/  vender/  ventas/  caja/  caja/historial/
│        │     ├─ productos/  stock/ingreso/  stock/movimientos/  usuarios/
│        │     └─ page.tsx              → Inicio
│        ├─ components/                 → barra, menú, campos reutilizables
│        ├─ config/navegacion.ts        → ítems del menú (con permiso)
│        ├─ features/                   → una carpeta por funcionalidad
│        ├─ hooks/                      → useConsulta, useLectorCodigoBarras, useValorDiferido
│        ├─ lib/apiClient.ts            → único cliente para llamar a la API
│        ├─ proxy.ts                    → redirige al login si no hay sesión
│        └─ theme/theme.ts
└─ packages/shared/src/
   ├─ auth/roles.ts                     → ⭐ roles y permisos
   ├─ config/negocio.ts                 → ⭐ nombre, moneda, zona horaria, medios de pago, logo y colores
   ├─ schemas/                          → validaciones Zod
   ├─ types/                            → tipos compartidos
   └─ utils/                            → formatos de moneda y fecha, búsqueda, números
```

---

## API

Todas las rutas empiezan con `/api`. Salvo `health` y `auth/login`, todas exigen sesión.

| Recurso | Rutas | Permiso |
|---|---|---|
| Estado | `GET /health` | Público |
| Sesión | `POST /auth/login` · `POST /auth/logout` · `GET /auth/sesion` · `POST /auth/cambiar-password` | Público / con sesión |
| Usuarios | `GET /usuarios` · `POST /usuarios` · `PATCH /usuarios/:id` · `POST /usuarios/:id/restablecer-password` | `usuarios.gestionar` |
| Categorías | `GET /categorias` · `POST` · `PATCH /:id` · `DELETE /:id` | Consultar: todos · Cambiar: `productos.gestionar` |
| Productos | `GET /productos` (búsqueda, filtros, paginación) · `GET /productos/codigo/:codigo` · `GET /productos/:id` · `POST` · `PATCH /:id` | Consultar: todos · Cambiar: `productos.gestionar` |
| Stock | `POST /stock/ingresos` · `POST /stock/ajustes` · `GET /stock/movimientos` | `stock.ingresar` · `stock.ajustar` · `stock.ver_historial` |
| Caja | `GET /caja/actual` · `POST /caja/abrir` · `GET`/`POST /caja/movimientos` · `POST /caja/cerrar` · `GET /caja/historial` · `GET /caja/:id` | `caja.operar` · historial: `caja.ver_totales` |
| Ventas | `POST /ventas` · `GET /ventas` · `GET /ventas/:id` · `POST /ventas/:id/anular` | `ventas.registrar` · anular: `ventas.anular` |
| Estadísticas | `GET /estadisticas?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | `estadisticas.ver` |

---

## Cómo agregar un módulo

**En la API**, en `apps/api/src/modules/<modulo>/`:

| Archivo | Responsabilidad |
|---|---|
| `<modulo>.repository.ts` | Consultas a la base con Drizzle. Sin lógica de negocio. |
| `<modulo>.service.ts` | Reglas de negocio; lanza `AppError` cuando algo no se puede hacer. |
| `<modulo>.controller.ts` | Valida la entrada con un esquema de `@stock/shared`, llama al service y responde. |
| `<modulo>.routes.ts` | Rutas de Express, con `requierePermiso(...)` cuando corresponde. |

Después:

1. Registrarlo en `src/routes.ts`.
2. Si tiene tablas, definirlas en `src/db/schema/`, correr `npm run db:generate` y luego `npm run db:migrate`.
3. Si necesita permisos nuevos, sumarlos en `packages/shared/src/auth/roles.ts`.

No hace falta try/catch en los controllers: Express 5 manda los errores de funciones async al manejador central.

**En la web:** los componentes van en `src/features/<modulo>/`, la página en `src/app/(panel)/<modulo>/page.tsx` y el ítem del menú en `src/config/navegacion.ts`.

---

## Personalizar o reutilizar para otro negocio

- **Datos del negocio:** [`packages/shared/src/config/negocio.ts`](packages/shared/src/config/negocio.ts) tiene el nombre, la moneda, la zona horaria, los medios de pago, el logo y los colores.
- **Roles y permisos:** [`packages/shared/src/auth/roles.ts`](packages/shared/src/auth/roles.ts).
- **Base reutilizable:** el tag `base-v1` tiene la estructura con login y roles, sin funcionalidades de un negocio en particular:
  ```bash
  git clone --branch base-v1 https://github.com/SebasAle95/sistema-stock.git nuevo-sistema
  cd nuevo-sistema && rm -rf .git && git init
  ```
  Después se editan `negocio.ts` y los `.env`, y se corre `npm install`, `npm run db:migrate`, `npm run crear-admin` y `npm run dev`.

---

## Ramas y flujo de trabajo

| Rama | Uso |
|---|---|
| `production` | Lo que está en uso. Solo recibe PR desde `development`. |
| `development` | Integración y pruebas. Recibe PR desde las ramas de trabajo. |
| `inicio-sistema` | La base reutilizable (estructura, login y roles). |
| `cantina` | Las funcionalidades de la cantina de La Frontera. |

Las ramas de trabajo salen de `development` y vuelven a ella por PR; de `development` se pasa a `production` cuando todo está probado.
