import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { origenesPermitidos } from './config/env';
import { manejadorDeErrores } from './middlewares/manejadorDeErrores';
import { registroDeSolicitudes } from './middlewares/registroDeSolicitudes';
import { rutaNoEncontrada } from './middlewares/rutaNoEncontrada';
import { rutas } from './routes';

export function crearApp() {
  const app = express();

  app.use(registroDeSolicitudes);
  app.use(helmet());
  app.use(cors({ origin: origenesPermitidos }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', rutas);

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
