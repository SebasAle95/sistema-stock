import path from 'node:path';
import type { NextConfig } from 'next';

/** Dirección de la API. Se lee al compilar: en producción hay que definirla antes de `npm run build`. */
const API_URL = process.env.API_URL ?? 'http://localhost:4100';

/**
 * La imagen de Docker (apps/web/Dockerfile) compila con NEXT_STANDALONE=1: Next deja en
 * `.next/standalone` un servidor con solo las dependencias que usa. La raíz del rastreo es la
 * del repositorio, porque @stock/shared y node_modules están ahí (npm workspaces). El build
 * corre desde apps/web (npm run build -w @stock/web), así que la raíz está dos carpetas arriba.
 * Sin la variable, `npm run build` y `npm run start:web` funcionan como siempre.
 */
const standalone: Partial<NextConfig> =
  process.env.NEXT_STANDALONE === '1'
    ? { output: 'standalone', outputFileTracingRoot: path.resolve(process.cwd(), '..', '..') }
    : {};

const nextConfig: NextConfig = {
  ...standalone,

  // @stock/shared se publica como código TypeScript: Next lo compila junto con la app.
  transpilePackages: ['@stock/shared'],

  /**
   * La web reenvía /api/* a la API. Para el navegador, web y API son el mismo sitio:
   * la cookie de sesión es "propia" (no de terceros), no hace falta CORS y la
   * dirección real de la API no queda expuesta.
   */
  async rewrites() {
    return [{ source: '/api/:ruta*', destination: `${API_URL}/api/:ruta*` }];
  },
};

export default nextConfig;
