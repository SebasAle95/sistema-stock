# Sistema de Stock — base reutilizable

Base para armar sistemas de stock y punto de venta. El frontend y la API están separados, cada uno en su carpeta, dentro de un mismo repositorio.

| Parte | Tecnología |
|---|---|
| Frontend (`apps/web`) | Next.js 16 · React 19 · TypeScript · Material UI 9 |
| API (`apps/api`) | Node · Express 5 · TypeScript · Zod |
| Base de datos | Postgres en Supabase · Drizzle ORM (consultas y migraciones) |
| Compartido (`packages/shared`) | Configuración del negocio, tipos y utilidades usados por web y API |

## Requisitos

- **Node 22 LTS** (mínimo 20.19). Con versiones más viejas npm muestra avisos `EBADENGINE`.
- npm (viene con Node).

## Primeros pasos

```bash
npm install

# Variables de entorno (estos archivos no se suben a git)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Levanta la API y la web juntas
npm run dev
```

- Web: http://localhost:3100
- API: http://localhost:4100/api/health

Los puertos son fijos y distintos de los habituales (3000/4000) para no chocar con otros proyectos abiertos al mismo tiempo.

Sin `DATABASE_URL`, la API arranca igual y la pantalla de inicio muestra la base como **"Sin configurar"**. Para conectarla, completá `DATABASE_URL` en `apps/api/.env` siguiendo las instrucciones de ese archivo.

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
│  │  │  ├─ middlewares/            → errores, 404, registro de solicitudes
│  │  │  ├─ modules/                → un módulo por funcionalidad
│  │  │  │  └─ health/              → módulo de ejemplo
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
│        │  └─ (panel)/             → pantallas con barra superior y menú
│        ├─ components/layout/      → AppShell, menú lateral, botón de tema
│        ├─ config/navegacion.ts    → ítems del menú lateral
│        ├─ features/               → una carpeta por funcionalidad
│        ├─ lib/apiClient.ts        → único cliente para llamar a la API
│        └─ theme/theme.ts          → tema de Material UI
└─ packages/
   └─ shared/src/
      ├─ config/negocio.ts          → ⭐ configuración del negocio
      ├─ types/                     → tipos compartidos (RespuestaApi, etc.)
      └─ utils/formato.ts           → formatearMoneda, formatearFecha
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

1. Se registra en `src/routes.ts`: `rutas.use('/productos', productosRoutes)`.
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
3. Completar los `.env` con la base de datos del nuevo sistema.
4. `npm install && npm run dev`.

## Ramas

| Rama | Uso |
|---|---|
| `production` | Lo que está en uso. Solo recibe PRs desde `development`. |
| `development` | Integración y pruebas. Recibe PRs desde las ramas de trabajo. |
| ramas de trabajo (`inicio-sistema`, …) | Salen de `development` y vuelven a `development` por PR. |
