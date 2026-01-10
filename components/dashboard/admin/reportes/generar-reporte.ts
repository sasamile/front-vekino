"use client";

import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type { TipoReporte, FormatoReporte } from "./constants";

export interface ReporteFilters {
  tipoReporte: TipoReporte;
  formato: FormatoReporte;
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: string;
  unidadId?: string;
  userId?: string;
  estados?: string[];
  incluirDetalles?: boolean;
}

export interface ReporteResponse {
  tipoReporte: string;
  formato: string;
  datos: any[];
  total: number;
  resumen: Record<string, any>;
  fechaGeneracion: string;
  periodo: string;
  filtros: Record<string, any>;
}

export async function generarReporte(
  filters: ReporteFilters,
  subdomain: string | null,
  setReporteData: (data: ReporteResponse | null) => void,
  setIsGenerating: (loading: boolean) => void
) {
  setIsGenerating(true);
  try {
    const axiosInstance = getAxiosInstance(subdomain);
    const payload: any = {
      tipoReporte: filters.tipoReporte,
      formato: filters.formato,
    };

    if (filters.fechaInicio) payload.fechaInicio = filters.fechaInicio;
    if (filters.fechaFin) payload.fechaFin = filters.fechaFin;
    if (filters.periodo) payload.periodo = filters.periodo;
    if (filters.unidadId) payload.unidadId = filters.unidadId;
    if (filters.userId) payload.userId = filters.userId;
    if (filters.estados && filters.estados.length > 0)
      payload.estados = filters.estados;
    if (filters.incluirDetalles !== undefined)
      payload.incluirDetalles = filters.incluirDetalles;

    if (filters.formato === "CSV") {
      // Para CSV, descargar directamente
      const response = await axiosInstance.post(
        "/reportes/generar",
        payload,
        {
          responseType: "blob",
        }
      );

      // Obtener el nombre del archivo del header
      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `reporte-${filters.tipoReporte.toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;

      // Crear blob y descargar
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Reporte CSV descargado exitosamente", {
        duration: 3000,
      });
    } else {
      // Para JSON, mostrar en la interfaz
      const response = await axiosInstance.post("/reportes/generar", payload);
      setReporteData(response.data);
      toast.success("Reporte generado exitosamente", {
        duration: 3000,
      });
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Error al generar el reporte";
    toast.error(errorMessage, {
      duration: 4000,
    });
  } finally {
    setIsGenerating(false);
  }
}


