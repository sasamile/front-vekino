"use client";

import { useState } from "react";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { useQuery } from "@tanstack/react-query";
import type { Unidad } from "@/types/types";
import { FiltrosReporte } from "@/components/dashboard/admin/reportes/filtros-reporte";
import { ResumenReporte } from "@/components/dashboard/admin/reportes/resumen-reporte";
import { TablaReporte } from "@/components/dashboard/admin/reportes/tabla-reporte";
import { generarReporte } from "@/components/dashboard/admin/reportes/generar-reporte";
import type { ReporteFilters, ReporteResponse } from "@/components/dashboard/admin/reportes/generar-reporte";

function ReportesPage() {
  const { subdomain } = useSubdomain();
  const [filters, setFilters] = useState<ReporteFilters>({
    tipoReporte: "PAGOS",
    formato: "JSON",
  });
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [reporteData, setReporteData] = useState<ReporteResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Obtener unidades para filtros
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const handleEstadoToggle = (estado: string) => {
    setSelectedEstados((prev) => {
      const newEstados = prev.includes(estado)
        ? prev.filter((e) => e !== estado)
        : [...prev, estado];
      setFilters((prevFilters) => ({
        ...prevFilters,
        estados: newEstados.length > 0 ? newEstados : undefined,
      }));
      return newEstados;
    });
  };

  const handleEstadoReset = () => {
    setSelectedEstados([]);
  };

  const handleGenerarReporte = async () => {
    await generarReporte(filters, subdomain, setReporteData, setIsGenerating);
  };

  const handleDescargarCSV = async () => {
    const tempFormato = filters.formato;
    setFilters((prev) => ({ ...prev, formato: "CSV" }));
    await generarReporte(
      { ...filters, formato: "CSV" },
      subdomain,
      setReporteData,
      setIsGenerating
    );
    setFilters((prev) => ({ ...prev, formato: tempFormato }));
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-2">
            Genera reportes detallados del condominio
          </p>
        </div>
      </div>

      <FiltrosReporte
        filters={filters}
        unidades={unidades}
        selectedEstados={selectedEstados}
        onFiltersChange={setFilters}
        onEstadoToggle={handleEstadoToggle}
        onEstadoReset={handleEstadoReset}
        onGenerar={handleGenerarReporte}
        isGenerating={isGenerating}
      />

      {/* Resultados del Reporte */}
      {reporteData && filters.formato === "JSON" && (
        <div className="space-y-6">
          <ResumenReporte reporteData={reporteData} />
          <TablaReporte
            reporteData={reporteData}
            filters={filters}
            onDescargarCSV={handleDescargarCSV}
          />
        </div>
      )}
    </div>
  );
}

export default ReportesPage;
