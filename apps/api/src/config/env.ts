import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

/** Convierte "" en undefined, para que una variable vacía en el .env cuente como "no definida". */
const vacioComoIndefinido = (valor: unknown) => (valor === '' ? undefined : valor);

const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4100),
  CORS_ORIGIN: z.string().default('http://localhost:3100'),
  DATABASE_URL: z.preprocess(
    vacioComoIndefinido,
    z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'Tiene que empezar con postgresql://')
      .optional(),
  ),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error('❌ Variables de entorno inválidas:\n' + z.prettifyError(resultado.error));
  process.exit(1);
}

export const env = resultado.data;

export const origenesPermitidos = env.CORS_ORIGIN.split(',').map((origen) => origen.trim());
