import { defineConfig } from 'tsup';

export default defineConfig({
  // Además de la API, los scripts que hacen falta en producción (sin tsx ni drizzle-kit):
  // dist/migrar.js y dist/crear-admin.js.
  entry: {
    index: 'src/index.ts',
    migrar: 'src/scripts/migrar.ts',
    'crear-admin': 'src/scripts/crearAdmin.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // @stock/shared se publica como código TypeScript: se incluye dentro del build.
  noExternal: [/^@stock\//],
});
