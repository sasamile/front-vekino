// Cache de dominios válidos (se actualiza cada 5 minutos)
// Cache compartido en memoria para evitar múltiples requests
let cachedDomains: string[] = [];
let lastFetchTime = 0;
let pendingFetch: Promise<string[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la lista de dominios válidos con cache
 */
export async function getValidDomains(): Promise<string[]> {
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

/**
 * Calcula la distancia de Levenshtein (similitud entre strings)
 */
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

/**
 * Encuentra el subdominio más similar en la lista de dominios válidos
 */
export function findClosestSubdomain(invalidSubdomain: string, validDomains: string[]): string | null {
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

