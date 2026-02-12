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
  "/visitantes",
];

/**
 * Lista de rutas exclusivas para GUARDIA_SEGURIDAD
 */
const GUARDIA_ROUTES = [
  "/control-visitantes",
  "/paqueteria",
  "/control-reservas",
  "/avisos",
  "/novedades",
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
  const normalizedPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  
  // Si la ruta es pública, permitir acceso
  if (isPublicRoute(normalizedPath)) {
    return true;
  }

  // Verificar rutas específicas por rol (rutas de grupos de Next.js)
  // IMPORTANTE: Verificar SUPERADMIN primero porque puede acceder a todo
  const matchingSuperAdminRoute = SUPERADMIN_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingSuperAdminRoute) {
    return userRole === 'SUPERADMIN';
  }

  const matchingAdminRoute = ADMIN_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingAdminRoute) {
    // ADMIN y SUPERADMIN pueden acceder a rutas de ADMIN
    return userRole === 'ADMIN' || userRole === 'SUPERADMIN';
  }

  const matchingUserRoute = USER_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingUserRoute) {
    return userRole === 'PROPIETARIO';
  }

  const matchingGuardiaRoute = GUARDIA_ROUTES.find(route => normalizedPath.startsWith(route));
  if (matchingGuardiaRoute) {
    return userRole === 'GUARDIA_SEGURIDAD';
  }

  // Rutas protegidas por prefijo de pathname
  if (normalizedPath.startsWith('/admin')) {
    return userRole === 'ADMIN' || userRole === 'SUPERADMIN';
  }

  if (normalizedPath.startsWith('/superadmin')) {
    return userRole === 'SUPERADMIN';
  }

  if (normalizedPath.startsWith('/user')) {
    return userRole === 'PROPIETARIO';
  }

  // Para otras rutas (como /), permitir acceso si está autenticado
  // Esto se puede ajustar según las necesidades
  return true;
}

