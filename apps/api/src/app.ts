import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, origenesPermitidos } from './config/env';
import { manejadorDeErrores } from './middlewares/manejadorDeErrores';
import { registroDeSolicitudes } from './middlewares/registroDeSolicitudes';
import { rutaNoEncontrada } from './middlewares/rutaNoEncontrada';
import { sinCache, verificarOrigen } from './middlewares/seguridad';
import { rutas } from './routes';

export function crearApp() {
  const app = express();

  // Para conocer la IP real del cliente cuando el pedido llega a través de la web (proxy).
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(registroDeSolicitudes);
  app.use(helmet());
  app.use(cors({ origin: origenesPermitidos, credentials: true }));
  app.use(verificarOrigen);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sinCache);

  app.use('/api', rutas);

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
