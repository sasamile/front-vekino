import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache de dominios válidos (se actualiza cada 5 minutos)
// Cache compartido en memoria para evitar múltiples requests
let cachedDomains: string[] = [];
let lastFetchTime = 0;
let pendingFetch: Promise<string[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getValidDomains(): Promise<string[]> {
  const now = Date.now();
  
  // Si el cache es válido, retornarlo inmediatamente
  if (cachedDomains.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedDomains;
  }

  // Si ya hay un fetch en progreso, esperar a que termine en lugar de hacer otro
  if (pendingFetch) {
    return pendingFetch;
  }

  // Crear un nuevo fetch y guardarlo como pendiente
  pendingFetch = (async () => {
    try {
      const response = await fetch('https://vekino.site/api/condominios/domains', {
        cache: 'no-store', // No usar cache del navegador, usar nuestro cache en memoria
      });
      
      if (response.ok) {
        const domains = await response.json();
        if (Array.isArray(domains)) {
          cachedDomains = domains;
          lastFetchTime = Date.now();
          pendingFetch = null;
          return domains;
        }
      }
    } catch (error) {
      console.error('Error al obtener dominios:', error);
    } finally {
      pendingFetch = null;
    }

    // Si falla, retornar el cache anterior o array vacío
    return cachedDomains.length > 0 ? cachedDomains : [];
  })();

  return pendingFetch;
}

// Función para calcular la distancia de Levenshtein (similitud entre strings)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcular distancia
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // eliminación
        matrix[i][j - 1] + 1,      // inserción
        matrix[i - 1][j - 1] + cost // sustitución
      );
    }
  }

  return matrix[len1][len2];
}

// Encontrar el subdominio más similar
function findClosestSubdomain(invalidSubdomain: string, validDomains: string[]): string | null {
  if (validDomains.length === 0) return null;

  let closestDomain: string | null = null;
  let minDistance = Infinity;

  for (const domain of validDomains) {
    const distance = levenshteinDistance(invalidSubdomain.toLowerCase(), domain.toLowerCase());
    
    // Si la distancia es menor y razonable (máximo 3 caracteres de diferencia)
    if (distance < minDistance && distance <= 3) {
      minDistance = distance;
      closestDomain = domain;
    }
  }

  return closestDomain;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Detectar si es localhost (desarrollo) o dominio de producción
  const isLocalhost = hostname.includes('localhost');
  
  // Extraer el subdominio
  // Ejemplo: condominio.localhost:3000 -> condominio
  // Ejemplo: localhost:3000 -> null (sin subdominio)
  let subdomain: string | null = null;
  
  if (isLocalhost) {
    // Para localhost, verificar si hay un subdominio antes de "localhost"
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else {
    // Para producción, extraer el subdominio (primera parte antes del primer punto)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Ejemplo: condominio.vekino.site -> condominio
      subdomain = parts[0];
    }
  }
  
  // Si no hay subdominio (acceso directo a localhost:3000 o dominio principal), permitir acceso
  if (!subdomain) {
    return NextResponse.next();
  }

  // Obtener dominios válidos
  const validDomains = await getValidDomains();
  
  // Validar que el subdominio esté en la lista de dominios válidos
  if (validDomains.length > 0 && !validDomains.includes(subdomain)) {
    // Buscar el subdominio más similar
    const closestSubdomain = findClosestSubdomain(subdomain, validDomains);
    
    if (closestSubdomain) {
      // Construir la URL correcta con el subdominio válido
      const url = request.nextUrl.clone();
      const path = url.pathname + url.search;
      
      if (isLocalhost) {
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

  // Agregar el subdominio a los headers para que esté disponible en el cliente
  const response = NextResponse.next();
  response.headers.set('x-subdomain', subdomain);
  
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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

