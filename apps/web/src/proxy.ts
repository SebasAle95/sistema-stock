import { COOKIE_SESION } from '@stock/shared';
import { NextResponse, type NextRequest } from 'next/server';

/** Pantallas que se pueden ver sin haber iniciado sesión. */
const RUTAS_PUBLICAS = new Set(['/login']);

/**
 * Control rápido antes de mostrar cada pantalla: si no hay cookie de sesión,
 * lleva al login. Es solo un filtro "optimista" (no consulta la base): la
 * validación real de la sesión, el rol y los permisos la hace siempre la API.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const tieneCookie =
    request.cookies.has(COOKIE_SESION.desarrollo) || request.cookies.has(COOKIE_SESION.produccion);

  if (!tieneCookie && !RUTAS_PUBLICAS.has(pathname)) {
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('siguiente', pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // No corre para /api (lo resuelve la API), ni para archivos estáticos e imágenes.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
