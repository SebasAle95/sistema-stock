import type { NextConfig } from 'next';

/** Dirección de la API. Se lee al compilar: en producción hay que definirla antes de `npm run build`. */
const API_URL = process.env.API_URL ?? 'http://localhost:4100';

const nextConfig: NextConfig = {
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
