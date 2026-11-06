# Imagen de producción de la web (docs/despliegue.md). Se construye desde la raíz del repositorio:
#   docker build -f apps/web/Dockerfile .
# Usa la salida "standalone" de Next (ver next.config.ts): solo lo necesario para correr.

FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @stock/web --include-workspace-root --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
# API_URL se lee al compilar: es el nombre del servicio de la API dentro de la red de Docker.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE=1 \
    API_URL=http://api:4100
RUN npm run build -w @stock/web

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public apps/web/public
USER node
EXPOSE 3100
CMD ["node", "apps/web/server.js"]
