import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // @stock/shared se publica como código TypeScript: se incluye dentro del build.
  noExternal: [/^@stock\//],
});
