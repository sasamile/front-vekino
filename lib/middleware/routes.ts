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
  return pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api');
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
];

/**
 * Lista de rutas exclusivas para USER
 */
// const USER_ROUTES = [
//   // Agregar rutas de user aquí si es necesario
// ];

/**
 * Verifica si un usuario puede acceder a una ruta según su rol
 * - USER: solo puede acceder a rutas /user/* o rutas en USER_ROUTES
 * - ADMIN: solo puede acceder a rutas /admin/* o rutas en ADMIN_ROUTES
 * - SUPERADMIN: solo puede acceder a rutas /superadmin/* o rutas en SUPERADMIN_ROUTES
 */
export function canAccessRoute(pathname: string, userRole: UserRole): boolean {
  // Si la ruta es pública, permitir acceso
  if (isPublicRoute(pathname)) {
    return true;
  }

  // Verificar rutas específicas por rol (rutas de grupos de Next.js)
  if (SUPERADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return userRole === 'SUPERADMIN';
  }
  
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return userRole === 'ADMIN';
  }
  
  // if (USER_ROUTES.some(route => pathname.startsWith(route))) {
  //   return userRole === 'USER';
  // }

  // Rutas protegidas por prefijo de pathname
  if (pathname.startsWith('/admin')) {
    return userRole === 'ADMIN';
  }
  
  if (pathname.startsWith('/superadmin')) {
    return userRole === 'SUPERADMIN';
  }
  
  if (pathname.startsWith('/user')) {
    return userRole === 'USER';
  }

  // Para otras rutas (como /), permitir acceso si está autenticado
  // Esto se puede ajustar según las necesidades
  return true;
}

