/**
 * Utilidades para guardar y leer información del condominio desde localStorage
 */

const STORAGE_KEY_PREFIX = 'vekino_condominio_';

export interface CondominioStorageData {
  logo: string | null;
  primaryColor: string;
  name: string;
  subdomain: string;
  lastUpdated: number;
}

/**
 * Obtiene la clave de storage para un subdomain específico
 */
function getStorageKey(subdomain: string): string {
  return `${STORAGE_KEY_PREFIX}${subdomain}`;
}

/**
 * Guarda la información del condominio en localStorage
 */
export function saveCondominioToStorage(
  subdomain: string,
  data: {
    logo: string | null;
    primaryColor: string;
    name: string;
  }
): void {
  if (typeof window === 'undefined') return;

  try {
    const storageData: CondominioStorageData = {
      ...data,
      subdomain,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(getStorageKey(subdomain), JSON.stringify(storageData));
  } catch (error) {
    console.warn('Error al guardar condominio en localStorage:', error);
  }
}

/**
 * Lee la información del condominio desde localStorage
 */
export function getCondominioFromStorage(
  subdomain: string | null
): CondominioStorageData | null {
  if (typeof window === 'undefined' || !subdomain) return null;

  try {
    const stored = localStorage.getItem(getStorageKey(subdomain));
    if (!stored) return null;

    const data: CondominioStorageData = JSON.parse(stored);
    
    // Verificar que los datos no sean muy antiguos (más de 24 horas)
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    if (Date.now() - data.lastUpdated > maxAge) {
      // Eliminar datos antiguos
      localStorage.removeItem(getStorageKey(subdomain));
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error al leer condominio de localStorage:', error);
    return null;
  }
}

/**
 * Aplica el color primario desde localStorage inmediatamente
 */
export function applyPrimaryColorFromStorage(subdomain: string | null): void {
  if (typeof window === 'undefined') return;

  const stored = getCondominioFromStorage(subdomain);
  if (!stored?.primaryColor) return;

  const root = document.documentElement;
  const hex = stored.primaryColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  root.style.setProperty('--primary', stored.primaryColor);
  root.style.setProperty('--primary-foreground', '#ffffff');
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
}

/**
 * Limpia todos los datos de condominios almacenados
 */
export function clearCondominioStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error al limpiar localStorage de condominios:', error);
  }
}
