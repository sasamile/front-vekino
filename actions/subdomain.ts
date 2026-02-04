"use server";
import axios from "axios";

const DOMAINS_API_BASE =
  process.env.API_BASE_URL || process.env.DOMAINS_API_URL || "https://vekino.site";

export const getDomains = async () => {
  const url = `${DOMAINS_API_BASE}/api/condominios/domains`;

  try {
    // Timeout corto para no bloquear si el servidor no responde (ej. desde Docker)
    const response = await axios.get(url, {
      timeout: 5000,
      // Agregar headers para mejor compatibilidad
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    // Manejar errores de timeout o conexión de forma silenciosa
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.warn('No se pudo conectar al servidor para obtener dominios:', error.message);
      // Retornar array vacío en caso de error de conexión
      return [];
    }
    
    // Para otros errores, también retornar array vacío para no romper la UI
    console.error('Error al obtener dominios:', error.message);
    return [];
  }
}

