import { z } from 'zod';
import { diasEntre } from '../utils/fechas';
import { esquemaFecha } from './comunes';

export const MAX_DIAS_ESTADISTICAS = 366;

export const esquemaFiltrosEstadisticas = z
  .object({
    desde: esquemaFecha,
    hasta: esquemaFecha,
  })
  .refine((f) => f.desde <= f.hasta, { message: 'La fecha "desde" tiene que ser anterior a "hasta"', path: ['desde'] })
  .refine((f) => diasEntre(f.desde, f.hasta) <= MAX_DIAS_ESTADISTICAS, {
    message: 'El período puede ser de hasta un año',
    path: ['hasta'],
  });

export type FiltrosEstadisticas = z.infer<typeof esquemaFiltrosEstadisticas>;
