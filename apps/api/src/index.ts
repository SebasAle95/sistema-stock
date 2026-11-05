import { env } from './config/env';
import { crearApp } from './app';
import { cerrarConexion } from './db/client';

const servidor = crearApp().listen(env.PORT, () => {
  console.log(`✅ API escuchando en http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  if (!env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL vacía: la API funciona, pero sin base de datos.');
  }
});

async function apagar(senal: string) {
  console.log(`\n${senal} recibido, cerrando la API...`);
  servidor.close();
  await cerrarConexion();
  process.exit(0);
}

process.on('SIGINT', () => void apagar('SIGINT'));
process.on('SIGTERM', () => void apagar('SIGTERM'));
