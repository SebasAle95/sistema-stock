import { z } from 'zod';

export const esquemaCategoria = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Tiene que tener al menos 2 caracteres')
    .max(50, 'Puede tener hasta 50 caracteres'),
});

export type DatosCategoria = z.infer<typeof esquemaCategoria>;
