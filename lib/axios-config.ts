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
      // Solo redirigir en caso de 401 (Unauthorized) - sesión inválida o expirada
      // Los 403 (Forbidden) son errores de permisos que deben manejarse en la UI
      if (error.response?.status === 401) {
        // Solo redirigir si estamos en el navegador
        if (typeof window !== 'undefined') {
          // Evitar redirección infinita si ya estamos en login
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
        }
      }
      // Para 403, solo rechazar el error sin redirigir - la UI lo manejará
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Obtiene la URL base según el subdomain
 */
function getBaseUrl(subdomain: string | null): string {
  // DEV: SIEMPRE proxy local
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    return '/api';
  }

  // PROD
  if (subdomain) {
    return `https://${subdomain}.vekino.site/api`;
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
    // Actualizar la baseURL si el subdomain cambió
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

