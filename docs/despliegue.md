# Despliegue en producción

Cómo instalar y operar el sistema en **apps01** (VM de Proxmox de la oficina, `192.168.10.12`), publicado en **https://stock.hardhouse.com.ar**, al lado de HHSG (`sg.hardhouse.com.ar`).

> Cada paso que expone el servidor, crea usuarios o carga datos reales se hace **con aprobación explícita**. Este documento dice cómo hacerlo, no autoriza a hacerlo.

## Qué se levanta

`docker-compose.prod.yml`, proyecto `stock`:

| Servicio | Qué hace | Expuesto |
|---|---|---|
| `caddy` | HTTPS (Let's Encrypt) y cabeceras de seguridad. `/api/*` → `api`, el resto → `web` | 8081 y 8444 **solo en 127.0.0.1**, para el portero |
| `web` | Next.js (salida standalone), puerto 3100 | no |
| `api` | Express, puerto 4100. Cookie `__Host-sesion` (`Secure`), confía en un proxy (Caddy) para la IP real | no |
| `migrate` | aplica las migraciones pendientes en cada despliegue y termina; la `api` arranca después | no |

La base de datos está en **Supabase** (`DATABASE_URL`): no hay PostgreSQL en la VM.

```
internet ──▶ router 80/443 ──▶ portero (HAProxy, apps01)
                                 ├─ sg.hardhouse.com.ar    ──▶ Caddy de /opt/hhsg  (127.0.0.1:8080 / 8443)
                                 └─ stock.hardhouse.com.ar ──▶ Caddy de /opt/stock (127.0.0.1:8081 / 8444)
                                                                 ├─ /api/* ──▶ api:4100 ──▶ Supabase
                                                                 └─ resto  ──▶ web:3100
```

## 1. Antes de empezar

- **RAM de apps01:** tiene 2 GB y HHSG ya usa unos 1,3. El sistema en marcha suma unos 300–400 MB, pero **compilar la imagen de Next.js puede pasar 1 GB**. Antes del primer `--build`, subir la VM a 4 GB (Proxmox → *Hardware → Memory*) o agregar 2 GB de swap:

  ```sh
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
- **Puertos libres:** `sudo ss -tlnp | grep -E ':(8081|8444)\b'` no tiene que mostrar nada.
- **Supabase:** el proyecto creado y la URI del *Session pooler* a mano.

## 2. DNS

Registro **A** `stock.hardhouse.com.ar` → `186.158.210.126` (la IP pública de la oficina, la misma que `sg`). Esperar a que resuelva:

```sh
nslookup stock.hardhouse.com.ar 8.8.8.8
```

El router no se toca: 80 y 443 ya van al portero.

## 3. Código y configuración

```sh
sudo mkdir -p /opt/stock && sudo chown "$USER" /opt/stock
# Repo privado: deploy key de solo lectura (GitHub → Settings → Deploy keys), sin permiso de escritura.
git clone --branch production git@github.com:SebasAle95/sistema-stock.git /opt/stock
cd /opt/stock
cp deploy/env.ejemplo .env && chmod 600 .env
nano .env    # DATABASE_URL (Supabase → Connect → Session pooler)
```

Alias (en `~/.bashrc`):

```sh
alias st='docker compose -f /opt/stock/docker-compose.prod.yml --env-file /opt/stock/.env'
```

## 4. Levantar

```sh
st up -d --build --wait
st ps
st logs migrate                                   # "✅ Base de datos al día."
st exec api node -e "fetch('http://127.0.0.1:4100/api/health').then(r=>r.text()).then(console.log)"
```

Caddy todavía no puede sacar el certificado: el portero no le manda nada hasta el paso 5.

## 5. Portero: sumar el dominio

El portero es parte del repo de HHSG (`/opt/hhsg/deploy/portero/haproxy.cfg`). Cambiarlo **en el repo de HHSG** (rama, PR y merge a `main`) y después hacer `git pull` en `/opt/hhsg`. Si se edita a mano en el servidor, el próximo `git pull` choca.

En `frontend http`:

```haproxy
	acl stock hdr(host),field(1,:) -i stock.hardhouse.com.ar
	http-request return status 404 if !sit !hhsg !folklore !stock
	use_backend stock_http if stock
```

(la línea `http-request return status 404` reemplaza a la que ya existe).

En `frontend https`:

```haproxy
	use_backend stock_https if { req_ssl_sni -i stock.hardhouse.com.ar }
```

Backends nuevos, al final:

```haproxy
# Sistema de stock (Caddy de /opt/stock en esta misma VM, solo loopback). PROXY protocol lleva la
# IP del visitante, que Caddy lee antes del saludo TLS.
backend stock_http
	mode http
	server stock 127.0.0.1:8081

backend stock_https
	mode tcp
	server stock 127.0.0.1:8444 send-proxy-v2
```

Verificar y recargar **sin cortar** a los otros sitios:

```sh
cd /opt/hhsg && docker run --rm -v "$PWD/deploy/portero:/usr/local/etc/haproxy:ro" haproxy:3.2.25-alpine haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg
docker compose -f deploy/portero/compose.yml -p portero kill -s HUP haproxy
docker exec portero-haproxy-1 grep -c stock.hardhouse.com.ar /usr/local/etc/haproxy/haproxy.cfg   # > 0
```

Después, que Caddy pida el certificado y comprobar desde afuera (datos móviles):

```sh
st restart caddy && st logs -f caddy     # "certificate obtained successfully"
curl -fsS https://stock.hardhouse.com.ar/api/health
curl -fsS https://sg.hardhouse.com.ar/api/health    # HHSG sigue andando
```

**Volver atrás:** sacar las líneas de `stock` del portero y recargar (HUP). HHSG y los otros sitios no se enteran.

## 6. Primer administrador

```sh
st exec -it api node dist/crear-admin.js
```

Pide nombre, usuario y contraseña (no se muestra al escribirla). El resto de los usuarios se crean desde el sistema: **Usuarios**. Los datos de ejemplo (`demo:cargar`) **no** se cargan en producción.

## 7. Actualizar

```sh
cd /opt/stock
git fetch && git checkout <tag-o-commit>   # siempre algo mergeado en production
st up -d --build --wait                    # migrate aplica las migraciones nuevas antes de que arranque la api
st ps && curl -fsS https://stock.hardhouse.com.ar/api/health
docker image prune -f                      # imágenes viejas
```

**Volver atrás:** `git checkout <versión anterior> && st up -d --build --wait`. Si la versión nueva traía migraciones, el código anterior puede no entender el esquema: restaurar la base desde un backup (sección 8).

## 8. Backups

La base está en Supabase. El plan gratuito **no** incluye backups descargables, así que conviene sacar un `pg_dump` periódico (por ejemplo, con un cron en apps01 y copia a OneDrive como HHSG) o pasar a un plan pago. Pendiente de definir.

Backup manual:

```sh
source /opt/stock/.env
docker run --rm -v "$PWD:/out" postgres:17-alpine pg_dump "$DATABASE_URL" -Fc -f /out/stock-$(date +%Y%m%d-%H%M).dump
```

## 9. Operación

```sh
st ps                         # estado y healthchecks
st logs -f --tail=100 api     # también web, caddy, migrate
st restart api
```

- Todo tiene `restart: unless-stopped`: vuelve solo después de reiniciar la VM.
- El certificado lo renueva Caddy. Si vence, revisar DNS, el portero (`docker compose -f /opt/hhsg/deploy/portero/compose.yml -p portero logs`) y `st logs caddy`.
- **Nunca** `st down -v`: borra los certificados (no hay datos en la VM, pero Let's Encrypt limita cuántos se pueden pedir).
