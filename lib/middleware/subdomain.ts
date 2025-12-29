/**
 * Extrae el subdominio del hostname
 * @param hostname - El hostname de la request (ej: "condominio.localhost:3000" o "condominio.vekino.site")
 * @returns El subdominio o null si no hay subdominio
 */
export function extractSubdomain(hostname: string): string | null {
  const isLocalhost = hostname.includes('localhost');
  
  if (isLocalhost) {
    // Para localhost: condominio.localhost:3000 -> condominio
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
  } else {
    // Para producción: condominio.vekino.site -> condominio
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }
  
  return null;
}

/**
 * Detecta si el hostname es localhost
 */
export function isLocalhost(hostname: string): boolean {
  return hostname.includes('localhost');
}

