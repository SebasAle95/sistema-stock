# Imagen de producción de la API (docs/despliegue.md). Se construye desde la raíz del repositorio:
#   docker build -f apps/api/Dockerfile .
# También trae dist/migrar.js y dist/crear-admin.js, que se corren con la misma imagen.

# Dependencias de producción. En la imagen completa de Node, por si bcrypt tuviera que compilarse.
FROM node:22-bookworm AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev --workspace @stock/api --no-audit --no-fund

# Compilación: tsup deja todo en apps/api/dist, con @stock/shared incluido adentro.
FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @stock/api --include-workspace-root --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @stock/api

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
WORKDIR /app/apps/api
USER node
EXPOSE 4100
CMD ["node", "dist/index.js"]
