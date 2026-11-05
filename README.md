# Sistema de Stock — base reutilizable

Base para armar sistemas de stock y punto de venta. El frontend y la API están separados, cada uno en su carpeta, dentro de un mismo repositorio.

| Parte | Tecnología |
|---|---|
| Frontend (`apps/web`) | Next.js 16 · React 19 · TypeScript · Material UI 9 |
| API (`apps/api`) | Node · Express 5 · TypeScript · Zod |
| Base de datos | Postgres en Supabase · Drizzle ORM (consultas y migraciones) |
| Compartido (`packages/shared`) | Configuración del negocio, tipos y utilidades usados por web y API |

## Requisitos

- **Node 22 LTS** o superior.
- npm (viene con Node).

## Primeros pasos

```bash
npm install

# Variables de entorno (estos archivos no se suben a git)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Conectar la base de datos (Supabase)

1. Crear el proyecto en Supabase y guardar la contraseña de la base. **No crear tablas a mano**: las crean las migraciones.
2. Botón **Connect** → **Session pooler** → copiar la URI.
3. Pegarla en `apps/api/.env` como `DATABASE_URL=...`, reemplazando `[YOUR-PASSWORD]`.
4. Crear las tablas y el primer administrador:
   ```bash
   npm run db:migrate
   npm run crear-admin
   ```

### Levantar el sistema

```bash
npm run dev
```

- Web: http://localhost:3100
- API: http://localhost:4100/api/health

Los puertos son fijos y distintos de los habituales (3000/4000) para no chocar con otros proyectos abiertos al mismo tiempo.

Sin `DATABASE_URL`, la API arranca igual y la pantalla de inicio muestra la base como **"Sin configurar"**, pero no se puede iniciar sesión.

## Usuarios, roles y seguridad

No hay registro público. El primer administrador se crea con `npm run crear-admin`. Desde la pantalla **Usuarios**, ese administrador crea a los demás con una contraseña temporal, y cada usuario la cambia en su primer ingreso.

Los roles y permisos están en `packages/shared/src/auth/roles.ts`. Las pantallas y las rutas de la API se protegen por **permiso**, no por rol. Para sumar un rol nuevo alcanza con agregarlo ahí, asignarle permisos y generar una migración (el rol es un enum en la base).

| Medida | Detalle |
|---|---|
| Contraseñas | Solo **bcrypt** (costo 12, configurable con `BCRYPT_COSTO`). Nunca MD5 ni SHA. Mínimo 8 caracteres, con letras y números. Si se sube el costo, los hashes se actualizan solos en el siguiente ingreso. |
| Sesiones | Token aleatorio de 256 bits en una cookie `HttpOnly` + `SameSite=Lax` (`Secure` y prefijo `__Host-` en producción). En la base se guarda solo su SHA-256. Duran 12 h (`SESION_HORAS`) y se renuevan solas mientras se usen. |
| Cerrar sesión | Borra la sesión en la base: la cookie deja de servir aunque alguien la haya copiado. |
| Fuerza bruta | Bloqueo de la cuenta por 15 minutos después de 5 intentos fallidos, más un límite de 20 intentos fallidos cada 15 minutos por IP. |
| Usuarios inexistentes | Mismo mensaje y mismo tiempo de respuesta que una contraseña incorrecta: no se puede averiguar qué usuarios existen. |
| Cambios de cuenta | Al desactivar un usuario o restablecer su contraseña, se cierran sus sesiones en el momento. Al cambiar la propia contraseña, se cierran las demás sesiones. |
| Protecciones del administrador | Nadie puede cambiarse su propio rol ni desactivarse a sí mismo, y siempre tiene que quedar al menos un administrador activo. |
| CSRF | Cookie `SameSite=Lax`, y la API rechaza los pedidos que modifican datos si vienen de otro origen. |
| Supabase | Las tablas tienen RLS activado sin políticas: la API pública de Supabase no puede leerlas aunque se filtre la clave pública del proyecto. |
| Respuestas | `Cache-Control: no-store` y los headers de seguridad de Helmet. La API nunca devuelve el hash de la contraseña. |

### Qué puede hacer cada rol

| Acción | Administrador | Vendedor |
|---|:-:|:-:|
| Vender (pistola, buscador, botones rápidos) | ✅ | ✅ |
| Ver ventas | Todas | Solo las de la caja abierta |
| Anular ventas (solo de la caja abierta, devuelve stock) | ✅ | ❌ |
| Abrir caja, entradas/salidas de efectivo, cerrar caja | ✅ | ✅ (cierre ciego) |
| Ver efectivo esperado, diferencias e historial de cajas | ✅ | ❌ |
| Consultar productos, precios y stock | ✅ | ✅ |
| Crear/editar productos, precios y categorías; ver costos | ✅ | ❌ |
| Ingreso de mercadería | ✅ (con costo) | ✅ (sin costo) |
| Ajustes de stock, mermas e historial de movimientos | ✅ | ❌ |
| Estadísticas | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |

## Funcionalidades

- **Productos y categorías:** al pasar la pistola, si el código existe se abre el producto; si no, se da de alta con el código precargado. Los productos sin código (café, sándwich) se buscan por nombre o como botón rápido, y pueden no llevar control de stock.
- **Stock:** el stock nunca se edita a mano. Cada cambio (inicial, ingreso, venta, ajuste, merma, anulación) queda en `movimientos_stock` con quién y cuándo, en la misma transacción que actualiza el producto.
- **Ventas:** carrito con la pistola, cobro por medio de pago y vuelto. Los precios los pone el servidor, y cada renglón guarda el precio y el costo del momento. Se puede vender un producto sin stock en el sistema (queda en negativo y se avisa).
- **Caja:** una sola caja abierta a la vez. El cierre es ciego para el vendedor: carga lo contado y el administrador ve esperado, contado y diferencia.
- **Estadísticas:** recaudación, ganancia y margen, ventas y ticket promedio contra el período anterior; recaudación por día, horarios pico, medios de pago y productos más vendidos. Todo en hora de Argentina, y cada gráfico tiene vista de tabla.

En la web, `src/proxy.ts` redirige al login cuando no hay cookie. Es solo un filtro rápido: la validación real (sesión vigente, usuario activo, permisos) la hace la API en cada pedido.

La web reenvía `/api/*` a la API (ver `apps/web/next.config.ts`). Para el navegador, web y API son el mismo sitio, así la cookie de sesión no es "de terceros". En producción hay que definir `API_URL` antes de `npm run build`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | API + web en modo desarrollo (se recargan solas al guardar) |
| `npm run build` | Compila la API (`apps/api/dist`) y la web (`apps/web/.next`) |
| `npm run typecheck` | Verifica los tipos de TypeScript en todo el repo |
| `npm run lint` | Revisa el código de la web con ESLint |
| `npm run db:generate` | Genera una migración SQL a partir de los cambios en el esquema |
| `npm run db:migrate` | Aplica las migraciones pendientes en la base |
| `npm run db:studio` | Abre Drizzle Studio para ver y editar los datos |
| `npm run crear-admin` | Crea un usuario administrador (pide los datos; la contraseña no se muestra al escribirla) |

## Estructura

```
sistema-stock/
├─ apps/
│  ├─ api/                          → API REST
│  │  ├─ src/
│  │  │  ├─ config/env.ts           → variables de entorno validadas con Zod
│  │  │  ├─ db/
│  │  │  │  ├─ client.ts            → conexión a Postgres (obtenerDb)
│  │  │  │  └─ schema/              → tablas de Drizzle, un archivo por módulo
│  │  │  ├─ middlewares/            → sesión, permisos, seguridad, errores, 404
│  │  │  ├─ modules/                → un módulo por funcionalidad
│  │  │  │  ├─ auth/                → login, sesiones, contraseñas (bcrypt)
│  │  │  │  ├─ usuarios/            → gestión de usuarios (administrador)
│  │  │  │  └─ health/              → estado del sistema
│  │  │  ├─ scripts/crearAdmin.ts   → alta del primer administrador
│  │  │  ├─ shared/errors/          → AppError y atajos (noEncontrado, conflicto…)
│  │  │  ├─ utils/                  → responder()
│  │  │  ├─ routes.ts               → registro central de módulos
│  │  │  ├─ app.ts                  → armado de Express
│  │  │  └─ index.ts                → arranque del servidor
│  │  └─ drizzle/                   → migraciones SQL generadas
│  └─ web/                          → Frontend
│     └─ src/
│        ├─ app/
│        │  ├─ layout.tsx           → HTML base, fuente, tema
│        │  ├─ login/               → pantalla de ingreso
│        │  ├─ cambiar-password/    → cambio de contraseña (obligatorio si es temporal)
│        │  └─ (panel)/             → pantallas con sesión, barra superior y menú
│        ├─ components/             → AppShell, menú lateral, menú de usuario, encabezados
│        ├─ config/navegacion.ts    → ítems del menú lateral (con permiso opcional)
│        ├─ features/               → una carpeta por funcionalidad (auth, usuarios…)
│        ├─ lib/apiClient.ts        → único cliente para llamar a la API
│        ├─ proxy.ts                → redirige al login si no hay sesión
│        └─ theme/theme.ts          → tema de Material UI
└─ packages/
   └─ shared/src/
      ├─ auth/roles.ts              → ⭐ roles y permisos
      ├─ config/negocio.ts          → ⭐ configuración del negocio
      ├─ schemas/                   → validaciones Zod (las usan web y API)
      ├─ types/                     → tipos compartidos (RespuestaApi, Usuario…)
      └─ utils/                     → formatos de moneda y fecha, errores de formularios
```

## Convenciones

### Respuesta de la API

Todas las respuestas tienen la misma forma:

```json
{ "ok": true,  "data": { } }
{ "ok": false, "error": { "codigo": "NO_ENCONTRADO", "mensaje": "No se encontró el producto" } }
```

En la web, `api.get / post / put / patch / delete` (de `lib/apiClient.ts`) devuelve directamente `data`, o lanza un `ErrorDeApi` con el mensaje listo para mostrar.

### Cómo se agrega un módulo (ejemplo: productos)

**API**, en `apps/api/src/modules/productos/`:

| Archivo | Responsabilidad |
|---|---|
| `productos.schema.ts` | Esquemas Zod de entrada (crear, editar, filtros) |
| `productos.repository.ts` | Consultas a la base con Drizzle (`obtenerDb()`); no tiene lógica de negocio |
| `productos.service.ts` | Reglas de negocio; lanza `AppError` cuando algo no se puede hacer |
| `productos.controller.ts` | Lee `req`, valida con `esquema.parse(...)`, llama al service y usa `responder()` |
| `productos.routes.ts` | Rutas de Express del módulo |

Después:

1. Se registra en `src/routes.ts`: `rutas.use('/productos', productosRoutes)`. Todo lo que está debajo de `requiereSesion()` exige sesión. Para limitarlo a ciertos roles, se suma `requierePermiso('productos.gestionar')` en las rutas del módulo y el permiso nuevo en `roles.ts`.
2. La tabla va en `src/db/schema/productos.ts` y se re-exporta desde `src/db/schema/index.ts`.
3. `npm run db:generate` y luego `npm run db:migrate`.

No hace falta try/catch en los controllers: Express 5 manda los errores de funciones async al manejador central, que los convierte en `{ ok: false, error }`.

**Web**, en `apps/web/src/features/productos/` (componentes, hooks y tipos del módulo). La página va en `src/app/(panel)/productos/page.tsx` y el ítem del menú se suma en `src/config/navegacion.ts`.

## Reutilizar la base para otro sistema

1. Partir del tag `base-v1` (la base sin funcionalidades de ningún negocio en particular):
   ```bash
   git clone --branch base-v1 https://github.com/SebasAle95/sistema-stock.git nuevo-sistema
   cd nuevo-sistema
   rm -rf .git && git init
   ```
2. Editar **`packages/shared/src/config/negocio.ts`**: nombre, moneda, zona horaria, medios de pago y colores.
3. Ajustar roles y permisos en **`packages/shared/src/auth/roles.ts`** si el negocio lo necesita.
4. Completar los `.env` con la base de datos del nuevo sistema.
5. `npm install`, `npm run db:migrate`, `npm run crear-admin` y `npm run dev`.

## Ramas

| Rama | Uso |
|---|---|
| `production` | Lo que está en uso. Solo recibe PRs desde `development`. |
| `development` | Integración y pruebas. Recibe PRs desde las ramas de trabajo. |
| ramas de trabajo (`inicio-sistema`, …) | Salen de `development` y vuelven a `development` por PR. |
