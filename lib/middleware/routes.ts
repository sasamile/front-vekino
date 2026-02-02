import type { UserRole } from './types';

/**
 * Verifica si una ruta requiere autenticación
 */
export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/auth');
}

/**
 * Verifica si una ruta es pública (no requiere autenticación)
 */
export function isPublicRoute(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api') || pathname === '/pago-exitoso';
}

/**
 * Lista de rutas exclusivas para SUPERADMIN
 * Estas rutas están en app/(dashboard)/(superadmin)/ pero el pathname no incluye el prefijo
 */
const SUPERADMIN_ROUTES = [
  '/condominios',
  '/administradores',
];

/**
 * Lista de rutas exclusivas para ADMIN
 * Estas rutas están en app/(dashboard)/(admin)/ pero el pathname no incluye el prefijo
 */
const ADMIN_ROUTES = [
  '/unidades',
  '/residentes',
  '/guardias',
];

/**
 * Lista de rutas exclusivas para USER (PROPIETARIO)
 */
const USER_ROUTES = [
  "/pagos",
  "/reservations",

];

/**
 * Verifica si un usuario puede acceder a una ruta según su rol
 * - USER: solo puede acceder a rutas /user/* o rutas en USER_ROUTES
 * - ADMIN: solo puede acceder a rutas /admin/* o rutas en ADMIN_ROUTES
 * - SUPERADMIN: solo puede acceder a rutas /superadmin/* o rutas en SUPERADMIN_ROUTES
 * - GUARDIA_SEGURIDAD: no tiene acceso a rutas administrativas por defecto
 */
export function canAccessRoute(pathname: string, userRole: UserRole): boolean {
  // Normalizar pathname (remover trailing slash y query params para comparación)
  // Pero mantener el pathname original para logging
  const originalPath = pathname;
  const normalizedPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  
  // Log para diagnóstico
  console.log(`[canAccessRoute] Verificando acceso - Pathname original: "${originalPath}", Normalizado: "${normalizedPath}", Rol: ${userRole}`);
  
  // Si la ruta es pública, permitir acceso
  if (isPublicRoute(normalizedPath)) {
    console.log(`[canAccessRoute] Ruta pública, acceso permitido`);
    return true;
  }

  // Verificar rutas específicas por rol (rutas de grupos de Next.js)
  // IMPORTANTE: Verificar SUPERADMIN primero porque puede acceder a todo
  const matchingSuperAdminRoute = SUPERADMIN_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingSuperAdminRoute) {
    const allowed = userRole === 'SUPERADMIN';
    console.log(`[canAccessRoute] Ruta SUPERADMIN "${matchingSuperAdminRoute}" - Acceso: ${allowed}`);
    return allowed;
  }

  const matchingAdminRoute = ADMIN_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingAdminRoute) {
    // ADMIN y SUPERADMIN pueden acceder a rutas de ADMIN
    const allowed = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    console.log(`[canAccessRoute] Ruta ADMIN "${matchingAdminRoute}" - Acceso: ${allowed} (Rol: ${userRole})`);
    return allowed;
  }

  const matchingUserRoute = USER_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingUserRoute) {
    const allowed = userRole === 'PROPIETARIO';
    console.log(`[canAccessRoute] Ruta USER "${matchingUserRoute}" - Acceso: ${allowed}`);
    return allowed;
  }

  // Rutas protegidas por prefijo de pathname
  if (normalizedPath.startsWith('/admin')) {
    const allowed = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    console.log(`[canAccessRoute] Ruta /admin/* - Acceso: ${allowed}`);
    return allowed;
  }

  if (normalizedPath.startsWith('/superadmin')) {
    const allowed = userRole === 'SUPERADMIN';
    console.log(`[canAccessRoute] Ruta /superadmin/* - Acceso: ${allowed}`);
    return allowed;
  }

  if (normalizedPath.startsWith('/user')) {
    const allowed = userRole === 'PROPIETARIO';
    console.log(`[canAccessRoute] Ruta /user/* - Acceso: ${allowed}`);
    return allowed;
  }

  // Para otras rutas (como /), permitir acceso si está autenticado
  // Esto se puede ajustar según las necesidades
  console.log(`[canAccessRoute] Ruta no específica, acceso permitido por defecto`);
  return true;
}

