import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @stock/shared se publica como código TypeScript: Next lo compila junto con la app.
  transpilePackages: ['@stock/shared'],
};

export default nextConfig;
