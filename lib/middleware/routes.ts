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
 * Verifica si un usuario puede acceder a una ruta según su rol
 * - USER: solo puede acceder a rutas /user/*
 * - ADMIN: solo puede acceder a rutas /admin/* (no puede acceder a /user/* ni /superadmin/*)
 * - SUPERADMIN: solo puede acceder a rutas /superadmin/* (no puede acceder a /user/* ni /admin/*)
 */
export function canAccessRoute(pathname: string, userRole: UserRole): boolean {
  // Si la ruta es pública, permitir acceso
  if (isPublicRoute(pathname)) {
    return true;
  }

  // Rutas protegidas por rol
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

