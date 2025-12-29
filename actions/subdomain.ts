"use server";
import axios from "axios";

export const getDomains = async () => {
  const url = 'https://vekino.site/api/condominios/domains';
  
  try {
    // Configurar timeout de 10 segundos para evitar esperas largas
    const response = await axios.get(url, {
      timeout: 10000, // 10 segundos
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

