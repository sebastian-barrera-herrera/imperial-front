import { NextResponse, type NextRequest } from 'next/server';

// Filtro rápido de navegación: sin cookie de sesión se manda al login. La autorización real
// (roles, propiedad de los datos) la hace siempre la API; esto solo evita mostrar pantallas vacías.
export function middleware(req: NextRequest) {
  if (!req.cookies.has('ilg_at')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
