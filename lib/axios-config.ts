import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

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
    withCredentials: true,
  });

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

