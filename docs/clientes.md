# Varios clientes con el mismo sistema

Un solo código sirve a varios negocios. Cada uno tiene **su marca, su base de datos y su instalación**, y nada de uno afecta al otro. Las mejoras generales les llegan a todos; lo particular de un cliente se activa solo para él.

| | Se comparte | Es de cada cliente |
|---|---|---|
| Código | ✅ mismo repositorio y ramas | — |
| Marca | — | nombre, logo, colores, lema |
| Configuración | — | medios de pago, zona horaria, funcionalidades |
| Datos | — | **su propio proyecto de Supabase** |
| Instalación | — | su carpeta en el servidor, su `.env`, su dominio y sus puertos |

## Cómo se elige el cliente

Con la variable `CLIENTE`. Se usa **al compilar**: cada imagen de Docker queda armada para un solo cliente. Sin la variable, el sistema es el de La Frontera, como siempre.

La configuración de cada uno está en [`packages/shared/src/config/clientes/`](../packages/shared/src/config/clientes/), y sus imágenes en `apps/web/public/clientes/<id>/`.

## Clientes actuales

| Cliente | `CLIENTE` | Dominio | Instalación | Puertos (HTTP/HTTPS) | Funcionalidades extra |
|---|---|---|---|---|---|
| La Frontera Fútbol 5 (cantina) | `la-frontera` | stock.hardhouse.com.ar | `/opt/stock` · proyecto `stock` | 8081 / 8444 | — |
| Bella Esencia (indumentaria) | `bella-esencia` | a definir | `/opt/stock-bella-esencia` · proyecto `stock-bella-esencia` | 8082 / 8445 | `variantes`, `devoluciones` |

Al sumar un cliente, agregalo a esta tabla con puertos que no use nadie.

## Funcionalidades por cliente

Se prenden en la configuración del cliente (`funcionalidades: [...]`). Apagadas, no aparecen en el menú y la API no registra sus rutas: no es solo ocultar un botón.

| Funcionalidad | Qué agrega |
|---|---|
| `variantes` | Productos con talles y colores: cada combinación con su stock y su código de barras (indumentaria). |
| `devoluciones` | Cambios y devoluciones de lo vendido, con vuelta al stock. |

**Para agregar una funcionalidad nueva:**

1. Sumarla en `FUNCIONALIDADES` (`packages/shared/src/config/tipos.ts`).
2. En la API, registrar sus rutas solo si está prendida: `if (tieneFuncionalidad('…')) rutas.use(…)`.
3. En el menú (`apps/web/src/config/navegacion.ts`), poner `funcionalidad: '…'` en sus ítems.
4. Prenderla solo en el cliente que la pidió.

**Reglas para no romper a otro cliente:**

- Todo lo nuevo arranca **apagado**.
- Las migraciones **solo agregan** (tablas, columnas con valor por defecto); nunca cambian ni borran lo que usa otro cliente. En la base de un cliente sin la funcionalidad, sus tablas quedan vacías.
- Antes de pasar a `production`, se prueba con un cliente que la tiene prendida y con uno que la tiene apagada.

## Agregar un cliente nuevo

1. **Configuración:** copiar `packages/shared/src/config/clientes/la-frontera.ts` como `<id>.ts` y completar:
   - `id`: en minúsculas y con guiones (por ejemplo `mi-local`). Es el valor de `CLIENTE`.
   - `nombre`, `nombreCorto` (pestaña del navegador) y `lema` (frase del login).
   - `mediosDePago`: tiene que incluir `efectivo`, porque la caja calcula el efectivo esperado con él.
   - `tema.primario`: el texto blanco encima tiene que leerse (contraste de 4,5:1 o más). `tema.secundario` es el acento.
   - `funcionalidades`: las que correspondan.
2. **Registrarlo** en `packages/shared/src/config/clientes/index.ts`.
3. **Imágenes** en `apps/web/public/clientes/<id>/`: el logo, preferentemente PNG con fondo transparente o SVG, y si querés una imagen de fondo para el login (`fondoLogin`).
4. **Base de datos:** un proyecto nuevo en Supabase, **solo para este cliente**. No crear tablas a mano: las crean las migraciones. El plan gratis permite 2 proyectos activos por organización.

### Probarlo en tu máquina

En `apps/api/.env` y en `apps/web/.env.local`, el mismo `CLIENTE=<id>`, y en `apps/api/.env` la `DATABASE_URL` **de la base de ese cliente**. Después:

```sh
npm run db:migrate      # crea las tablas en su base
npm run crear-admin
npm run dev             # reiniciarlo si ya estaba corriendo
```

Para volver a La Frontera: `CLIENTE=la-frontera` y su `DATABASE_URL`.

## Desplegar un cliente en el mismo servidor

Igual que en [despliegue.md](despliegue.md), pero en **otra carpeta** y con **otro `.env`**. Así se levanta una instalación completamente aparte: sus contenedores, sus imágenes y su Caddy con su certificado. Las de los demás clientes no se tocan. El ejemplo es Bella Esencia; cambiá el dominio por el que corresponda.

### 1. DNS

Registro **A** del dominio nuevo (por ejemplo `bellaesencia.hardhouse.com.ar`) → la IP pública de la oficina, la misma que `stock.hardhouse.com.ar`.

### 2. Código y configuración

```sh
sudo mkdir -p /opt/stock-bella-esencia && sudo chown "$USER" /opt/stock-bella-esencia
git clone --branch production git@github.com:SebasAle95/sistema-stock.git /opt/stock-bella-esencia
cd /opt/stock-bella-esencia
cp deploy/env.ejemplo .env && chmod 600 .env
nano .env
```

En el `.env`:

```sh
DOMINIO=bellaesencia.hardhouse.com.ar
DATABASE_URL=               # la de SU proyecto de Supabase, nunca la de otro cliente
CLIENTE=bella-esencia
NOMBRE_PROYECTO=stock-bella-esencia
PUERTO_HTTP=8082
PUERTO_HTTPS=8445
```

Alias (en `~/.bashrc`), distinto del de La Frontera (`st`):

```sh
alias stb='docker compose -f /opt/stock-bella-esencia/docker-compose.prod.yml --env-file /opt/stock-bella-esencia/.env'
```

### 3. Levantar

```sh
stb up -d --build --wait
stb ps
stb logs migrate        # "✅ Base de datos al día."
```

### 4. Portero

Igual que el paso 5 de [despliegue.md](despliegue.md), en el repositorio de HHSG, con el dominio y los puertos nuevos:

```haproxy
# frontend http
	acl bella hdr(host),field(1,:) -i bellaesencia.hardhouse.com.ar
	use_backend bella_http if bella
# (y sumar !bella a la línea "http-request return status 404 if …")

# frontend https
	use_backend bella_https if { req_ssl_sni -i bellaesencia.hardhouse.com.ar }

# backends
backend bella_http
	mode http
	server bella 127.0.0.1:8082

backend bella_https
	mode tcp
	server bella 127.0.0.1:8445 send-proxy-v2
```

Verificar y recargar sin cortar a los demás sitios, como dice esa guía. Después: `stb restart caddy && stb logs -f caddy` hasta ver "certificate obtained successfully".

### 5. Primer administrador

```sh
stb exec -it api node dist/crear-admin.js
```

### Actualizar

Cada instalación se actualiza por separado, cuando quieras:

```sh
cd /opt/stock-bella-esencia && git pull && stb up -d --build --wait     # Bella Esencia
cd /opt/stock && git pull && st up -d --build --wait                     # La Frontera
```
