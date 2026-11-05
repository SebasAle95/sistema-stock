import { z } from 'zod';

/**
 * Mensajes por defecto de Zod en español (para los casos sin mensaje propio).
 * Se importa primero en el index del paquete, así aplica en la web y en la API.
 */
z.config(z.locales.es());
