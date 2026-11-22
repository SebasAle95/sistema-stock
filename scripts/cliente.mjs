// Corre un script de npm para un cliente, sin editar archivos:
//   npm run bella                    → npm run dev con CLIENTE=bella-esencia
//   npm run bella -- db:migrate      → migra la base de Bella
//   npm run frontera -- crear-admin  → crea un administrador en la base de La Frontera
// La API toma la base de apps/api/.env.<cliente> (o de apps/api/.env para La Frontera).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cliente, ...comando] = process.argv.slice(2);

if (!cliente || !fs.existsSync(path.join(raiz, 'packages/shared/src/config/clientes', `${cliente}.ts`))) {
  console.error(`\n❌ No existe el cliente "${cliente ?? ''}" (ver packages/shared/src/config/clientes/).\n`);
  process.exit(1);
}

const script = comando.length > 0 ? comando.join(' ') : 'dev';
console.log(`\n▶ ${cliente}: npm run ${script}\n`);

const hijo = spawn(`npm run ${script}`, {
  cwd: raiz,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CLIENTE: cliente },
});
hijo.on('exit', (codigo, senal) => process.exit(codigo ?? (senal ? 1 : 0)));
