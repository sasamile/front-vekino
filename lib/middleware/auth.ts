import type { NextRequest } from 'next/server';
import type { AuthResponse } from './types';
import { extractSubdomain, isLocalhost } from './subdomain';

export interface VerifySessionResult {
  authData: AuthResponse | null;
  isTemporaryError: boolean; // true si es timeout o error temporal, false si es error real de auth
}

/**
 * Verifica la sesión del usuario usando la cookie better-auth.session_token
 * Retorna información sobre si el error es temporal (timeout) o real (401)
 */
export async function verifySession(
  request: NextRequest,
  subdomain: string | null
): Promise<VerifySessionResult> {
  const cookie = request.cookies.get('better-auth.session_token');
  
  if (!cookie) {
    return { authData: null, isTemporaryError: false };
  }

  try {
    // Determinar el endpoint según si hay subdomain
    let endpoint: string;
    let baseUrl: string;
    
    const hostname = request.headers.get('host') || '';
    const isLocal = isLocalhost(hostname);
    
    if (subdomain) {
      // Si hay subdominio, usar el endpoint de condominios
      // En local NO llamar a localhost (evita recursión en middleware)
      baseUrl = isLocal
        ? `https://${subdomain}.vekino.site/api`
        : `https://${subdomain}.vekino.site/api`;
      endpoint = '/condominios/me';
    } else {
      // Si no hay subdominio, usar el endpoint de superadmin
      baseUrl = 'https://vekino.site/api';
      endpoint = '/superadmin/me';
    }

    const url = `${baseUrl}${endpoint}`;
    
    // Hacer la petición con la cookie y timeout corto para evitar demoras
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Aumentar timeout a 5 segundos
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': `better-auth.session_token=${cookie.value}`,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'identity', // Evitar compresión para evitar problemas de descompresión
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        try {
          const data: AuthResponse = await response.json();
          return { authData: data, isTemporaryError: false };
        } catch (jsonError: any) {
          // Si hay error al parsear JSON (posible problema de descompresión), considerar error temporal
          console.warn('Error al parsear respuesta de verificación de sesión:', jsonError.message);
          return { authData: null, isTemporaryError: true };
        }
      }

      // Si la respuesta es 401, es un error real de autenticación
      if (response.status === 401) {
        return { authData: null, isTemporaryError: false };
      }

      // Para otros códigos de error (500, 503, etc.), considerar error temporal
      return { authData: null, isTemporaryError: true };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Si es un timeout, error de conexión, o error de descompresión, es un error temporal
      if (
        fetchError.name === 'AbortError' || 
        fetchError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        fetchError.message?.includes('terminated') ||
        fetchError.message?.includes('Gunzip') ||
        fetchError.message?.includes('fetch failed')
      ) {
        return { authData: null, isTemporaryError: true };
      }
      throw fetchError;
    }
  } catch (error) {
    // Solo loggear errores inesperados, no timeouts
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Error al verificar sesión:', error);
    }
    // Errores inesperados también se consideran temporales para no bloquear al usuario
    return { authData: null, isTemporaryError: true };
  }
}

