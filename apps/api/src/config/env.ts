import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

/** Convierte "" en undefined, para que una variable vacía en el .env cuente como "no definida". */
const vacioComoIndefinido = (valor: unknown) => (valor === '' ? undefined : valor);

/** Valor para `app.set('trust proxy')`: número de saltos, true/false o una lista de IPs/subredes. */
function interpretarTrustProxy(valor: string): boolean | number | string {
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  if (/^\d+$/.test(valor)) return Number(valor);
  return valor;
}

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
  /** Duración de la sesión. Se renueva sola mientras el usuario la siga usando. */
  SESION_HORAS: z.coerce.number().positive().max(720).default(12),
  /** Costo de bcrypt: cada +1 duplica el tiempo. 12 tarda ~250 ms, un buen equilibrio hoy. */
  BCRYPT_COSTO: z.coerce.number().int().min(10).max(15).default(12),
  /** Por defecto confía solo en proxies locales (la web de Next corriendo en la misma máquina). */
  TRUST_PROXY: z.string().default('loopback').transform(interpretarTrustProxy),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error('❌ Variables de entorno inválidas:\n' + z.prettifyError(resultado.error));
  process.exit(1);
}

export const env = resultado.data;

export const esProduccion = env.NODE_ENV === 'production';

export const origenesPermitidos = env.CORS_ORIGIN.split(',').map((origen) => origen.trim());
