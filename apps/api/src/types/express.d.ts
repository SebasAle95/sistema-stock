import type { Usuario } from '@stock/shared';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado. Lo completa el middleware `requiereSesion`. */
      usuario?: Usuario;
      /** Id de la sesión actual. Lo completa el middleware `requiereSesion`. */
      sesionId?: string;
    }
  }
}

export {};
