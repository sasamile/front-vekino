import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

/**
 * Configuración dinámica de axios basada en subdomain
 * Si hay subdomain: https://api-{subdomain}.vekino.site
 * Si no hay subdomain: https://api.vekino.site o https://vekino.site
 */
export function createAxiosInstance(subdomain: string | null): AxiosInstance {
  const instance = axios.create({
    baseURL: getBaseUrl(subdomain),
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // IMPORTANTE: Envía cookies automáticamente
  });

  // Interceptor de request: Asegurar que las cookies se envíen siempre
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Asegurar que withCredentials esté siempre activo
      config.withCredentials = true;
      
      // En el navegador, las cookies se envían automáticamente con withCredentials: true
      // No necesitamos agregar manualmente el header Cookie
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de response: Manejar errores de autenticación
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // NO redirigir automáticamente desde el interceptor.
      // El middleware de Next.js ya maneja la autenticación y redirige cuando es necesario.
      // Si redirigimos aquí, podemos interrumpir la carga del dashboard cuando hay errores
      // temporales o de permisos específicos (ej: un endpoint devuelve 401 pero otros funcionan).
      // 
      // Los errores se manejan en los componentes con React Query:
      // - 401: El middleware detectará la falta de sesión y redirigirá
      // - 403: Se maneja en la UI mostrando mensajes de error
      // 
      // Solo rechazar el error para que React Query lo maneje
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Obtiene el subdominio efectivo: si en el navegador no se pasa subdomain,
 * se deriva del hostname para evitar que las primeras peticiones vayan a vekino.site
 * (race: el SubdomainProvider actualiza subdomain en useEffect, pero los queries ya dispararon).
 */
function getEffectiveSubdomain(subdomain: string | null): string | null {
  if (typeof window === 'undefined') return subdomain;
  if (subdomain) return subdomain;
  const hostname = window.location.hostname;
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') return parts[0];
    return null;
  }
  const parts = hostname.split('.');
  // condominio-las-flores-actualizado.vekino.site -> condominio-las-flores-actualizado
  if (parts.length > 2) return parts[0];
  return null;
}

/**
 * Obtiene la URL base según el subdomain
 */
function getBaseUrl(subdomain: string | null): string {
  // SIEMPRE usar el proxy /api cuando estamos en el navegador (cliente)
  // El proxy (app/api/[...path]/route.ts) maneja correctamente el subdominio
  // desde el header 'host' de la request
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // Solo en el servidor (SSR) usar URLs completas
  const effective = getEffectiveSubdomain(subdomain);
  if (effective) {
    return `https://${effective}.vekino.site/api`;
  }

  return 'https://vekino.site/api';
}


/**
 * Instancia de axios por defecto (se actualizará dinámicamente)
 */
let axiosInstance: AxiosInstance | null = null;

/**
 * Obtiene o crea la instancia de axios con el subdomain actual
 */
export function getAxiosInstance(subdomain: string | null): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = createAxiosInstance(subdomain);
  } else {
    // Actualizar la baseURL si el subdomain cambió (getBaseUrl usa subdomain efectivo en navegador)
    const newBaseURL = getBaseUrl(subdomain);
    if (axiosInstance.defaults.baseURL !== newBaseURL) {
      axiosInstance.defaults.baseURL = newBaseURL;
    }
  }
  return axiosInstance;
}

/**
 * Resetea la instancia de axios (útil para cambios de subdomain)
 */
export function resetAxiosInstance(): void {
  axiosInstance = null;
}

