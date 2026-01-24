import type { NextRequest } from 'next/server';
import type { AuthResponse } from './types';
import { extractSubdomain, isLocalhost } from './subdomain';

/**
 * Verifica la sesión del usuario usando la cookie better-auth.session_token
 */
export async function verifySession(
  request: NextRequest,
  subdomain: string | null
): Promise<AuthResponse | null> {
  const cookie = request.cookies.get('better-auth.session_token');
  
  if (!cookie) {
    return null;
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
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
    
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
          return data;
        } catch (jsonError: any) {
          // Si hay error al parsear JSON (posible problema de descompresión), retornar null
          console.warn('Error al parsear respuesta de verificación de sesión:', jsonError.message);
          return null;
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Si es un timeout, error de conexión, o error de descompresión, retornar null silenciosamente
      if (
        fetchError.name === 'AbortError' || 
        fetchError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        fetchError.message?.includes('terminated') ||
        fetchError.message?.includes('Gunzip')
      ) {
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    // Solo loggear errores inesperados, no timeouts
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Error al verificar sesión:', error);
    }
  }

  return null;
}

