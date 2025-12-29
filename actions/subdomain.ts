"use server";
import axios from "axios";

 export const getDomains = async () => {
  try {
    const response = await axios.get(
      "https://vekino.site/api/condominios/domains"
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error al obtener dominios:", error);
    return [];
  }
}

