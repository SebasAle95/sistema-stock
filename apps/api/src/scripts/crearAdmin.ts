/**
 * Crea un usuario administrador desde la terminal.
 * Se usa para el primer ingreso al sistema (no hay registro público).
 *
 *   npm run crear-admin
 *
 * También acepta los datos por parámetro (útil para automatizar), pero la
 * contraseña queda en el historial de la terminal, así que es mejor escribirla
 * cuando la pide:
 *
 *   npm run crear-admin -- --nombre "Sebastián" --usuario sebas
 */
import { ROL_ADMINISTRADOR, esquemaCrearUsuario } from '@stock/shared';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { cerrarConexion, obtenerDb } from '../db/client';
import { hashearPassword } from '../modules/auth/password';
import { usuariosRepository } from '../modules/usuarios/usuarios.repository';

const { values: argumentos } = parseArgs({
  options: {
    nombre: { type: 'string' },
    usuario: { type: 'string' },
    password: { type: 'string' },
  },
});

/** Lee una línea sin mostrar lo que se escribe (muestra asteriscos). */
function leerOculto(pregunta: string): Promise<string> {
  stdout.write(pregunta);

  if (!stdin.isTTY) {
    // Sin terminal interactiva (por ejemplo, entrada redirigida): lectura normal.
    const rl = readline.createInterface({ input: stdin });
    return rl.question('').finally(() => rl.close());
  }

  return new Promise((resolve) => {
    let valor = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const alTeclear = (teclas: string) => {
      for (const tecla of teclas) {
        if (tecla === '\r' || tecla === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', alTeclear);
          stdout.write('\n');
          resolve(valor);
          return;
        }
        if (tecla === '\u0003') {
          stdout.write('\n');
          process.exit(130); // Ctrl+C
        }
        if (tecla === '\u007f' || tecla === '\b') {
          if (valor.length > 0) {
            valor = valor.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }
        valor += tecla;
        stdout.write('*');
      }
    };

    stdin.on('data', alTeclear);
  });
}

async function pedirDatos() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const nombre = argumentos.nombre ?? (await rl.question('Nombre completo: '));
  const usuario = argumentos.usuario ?? (await rl.question('Usuario para ingresar: '));
  rl.close();

  let password = argumentos.password;
  if (password === undefined) {
    password = await leerOculto('Contraseña: ');
    const confirmacion = await leerOculto('Repetí la contraseña: ');
    if (password !== confirmacion) throw new Error('Las contraseñas no coinciden.');
  }

  return { nombre, usuario, rol: ROL_ADMINISTRADOR, passwordTemporal: password };
}

async function main() {
  obtenerDb(); // falla rápido si no hay DATABASE_URL

  console.log('\n👤 Crear usuario administrador\n');
  const datos = esquemaCrearUsuario.parse(await pedirDatos());

  if (await usuariosRepository.buscarPorUsuario(datos.usuario)) {
    throw new Error(`Ya existe el usuario "${datos.usuario}".`);
  }

  await usuariosRepository.crear({
    nombre: datos.nombre,
    usuario: datos.usuario,
    rol: ROL_ADMINISTRADOR,
    passwordHash: await hashearPassword(datos.passwordTemporal),
    // La eligió la misma persona que la va a usar: no hace falta cambiarla al ingresar.
    debeCambiarPassword: false,
  });

  console.log(`\n✅ Administrador "${datos.usuario}" creado. Ya puede ingresar al sistema.\n`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Datos inválidos:\n' + z.prettifyError(error) + '\n');
    } else {
      console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
    }
    process.exitCode = 1;
  })
  .finally(() => cerrarConexion());
