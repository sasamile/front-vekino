import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractSubdomain, isLocalhost } from './lib/middleware/subdomain';
import { getValidDomains, findClosestSubdomain } from './lib/middleware/domains';
import { verifySession } from './lib/middleware/auth';
import { canAccessRoute } from './lib/middleware/routes';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Permitir acceso a archivos estáticos sin verificación
  // Archivos de imagen, CSS, JS, fuentes, etc.
  if (
    pathname.startsWith('/img/') ||
    pathname.startsWith('/logos/') ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }
  
  // Extraer el subdominio
  const subdomain = extractSubdomain(hostname);
  const isLocal = isLocalhost(hostname);
  
  // VALIDAR SUBDOMINIO PRIMERO (antes de cualquier otra verificación)
  // Si hay subdominio, validar que esté en la lista de dominios válidos
  if (subdomain) {
  // Obtener dominios válidos
  const validDomains = await getValidDomains();
  
  // Validar que el subdominio esté en la lista de dominios válidos
  if (validDomains.length > 0 && !validDomains.includes(subdomain)) {
    // Buscar el subdominio más similar
    const closestSubdomain = findClosestSubdomain(subdomain, validDomains);
    
    if (closestSubdomain) {
      // Construir la URL correcta con el subdominio válido
      const url = request.nextUrl.clone();
      
        if (isLocal) {
        // Para localhost: redirigir a closestSubdomain.localhost:puerto
        const port = hostname.includes(':') ? hostname.split(':')[1] : '3000';
        url.host = `${closestSubdomain}.localhost:${port}`;
      } else {
        // Para producción: redirigir a closestSubdomain.vekino.site
        const domainParts = hostname.split('.');
        const baseDomain = domainParts.slice(-2).join('.'); // Obtener los últimos 2 (ej: vekino.site)
        url.host = `${closestSubdomain}.${baseDomain}`;
      }
      
      // Redirigir al subdominio correcto
      return NextResponse.redirect(url);
    }
    
    // Si no se encuentra un subdominio similar, retornar 404
    return new NextResponse('Subdominio no válido', { status: 404 });
  }
  }
  
  // Verificar si hay cookie primero (verificación rápida)
  const cookie = request.cookies.get('better-auth.session_token');
  
  // Si está en /auth/login
  if (pathname.startsWith('/auth/login')) {
    // Si no hay cookie, permitir acceso al login
    if (!cookie) {
      return NextResponse.next();
    }
    
    // Si hay cookie, verificar la sesión
    const authData = await verifySession(request, subdomain);
    
    // Si la sesión es válida, redirigir a la página principal
    if (authData) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
    
    // Si hay cookie pero la sesión es inválida, permitir acceso al login
    // (el usuario puede intentar hacer login de nuevo)
    return NextResponse.next();
  }
  
  // Para otras rutas, verificar autenticación completa
  // Si no hay cookie, redirigir a login inmediatamente
  if (!cookie) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si hay cookie, verificar la sesión
  const authData = await verifySession(request, subdomain);
  
  // Si no hay sesión válida, redirigir a login
  if (!authData) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el usuario puede acceder a esta ruta según su rol
  if (!canAccessRoute(pathname, authData.user.role)) {
    // Si no tiene permiso, redirigir a la página principal o mostrar error
    // TODO: Puedes personalizar esto según tus necesidades
    // Por ejemplo, redirigir a una página de "acceso denegado"
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Agregar información de autenticación a los headers
  const response = NextResponse.next();
  
  if (subdomain) {
  response.headers.set('x-subdomain', subdomain);
  }
  
  // Agregar información del usuario autenticado
  response.headers.set('x-user-id', authData.user.id);
  response.headers.set('x-user-role', authData.user.role);
  response.headers.set('x-user-email', authData.user.email);
  
  return response;
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - img/ (image files)
     * - logos/ (logo files)
     * - favicon.ico (favicon file)
     * - static files (png, jpg, svg, etc.)
     */
    '/((?!api|_next/static|_next/image|img|logos|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
