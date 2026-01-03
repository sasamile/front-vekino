"use client";

import { useState } from "react";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconFilter,
  IconFileDownload,
  IconFileText,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { Unidad } from "@/types/types";

type TipoReporte =
  | "PAGOS"
  | "FACTURAS"
  | "CLIENTES"
  | "RESERVAS"
  | "RECAUDO"
  | "MOROSIDAD";

type FormatoReporte = "JSON" | "CSV";

interface ReporteFilters {
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

interface ReporteResponse {
  tipoReporte: string;
  formato: string;
  datos: any[];
  total: number;
  resumen: Record<string, any>;
  fechaGeneracion: string;
  periodo: string;
  filtros: Record<string, any>;
}

const TIPO_REPORTE_OPTIONS: { value: TipoReporte; label: string }[] = [
  { value: "PAGOS", label: "Pagos" },
  { value: "FACTURAS", label: "Facturas" },
  { value: "CLIENTES", label: "Clientes" },
  { value: "RESERVAS", label: "Reservas" },
  { value: "RECAUDO", label: "Recaudo" },
  { value: "MOROSIDAD", label: "Morosidad" },
];

const ESTADOS_PAGOS = [
  "PENDIENTE",
  "PROCESANDO",
  "APROBADO",
  "RECHAZADO",
  "CANCELADO",
];

const ESTADOS_FACTURAS = [
  "PENDIENTE",
  "ENVIADA",
  "PAGADA",
  "VENCIDA",
  "CANCELADA",
];

const ESTADOS_RESERVAS = [
  "PENDIENTE",
  "CONFIRMADA",
  "CANCELADA",
  "COMPLETADA",
];

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

  const getEstadosOptions = (): string[] => {
    switch (filters.tipoReporte) {
      case "PAGOS":
        return ESTADOS_PAGOS;
      case "FACTURAS":
        return ESTADOS_FACTURAS;
      case "RESERVAS":
        return ESTADOS_RESERVAS;
      default:
        return [];
    }
  };

  const handleTipoReporteChange = (tipo: TipoReporte) => {
    setFilters((prev) => ({
      ...prev,
      tipoReporte: tipo,
      estados: undefined,
    }));
    setSelectedEstados([]);
  };

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

  const generarReporte = async () => {
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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estadosOptions = getEstadosOptions();
  const hasEstadosFilter = estadosOptions.length > 0;

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

      {/* Formulario de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte y configura los filtros necesarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tipo de Reporte y Formato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {TIPO_REPORTE_OPTIONS.find(
                        (opt) => opt.value === filters.tipoReporte
                      )?.label || "Seleccionar tipo"}
                      <IconFilter className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    {TIPO_REPORTE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleTipoReporteChange(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label>Formato</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {filters.formato}
                      <IconFileText className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, formato: "JSON" }))
                      }
                    >
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, formato: "CSV" }))
                      }
                    >
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filtros de Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={filters.fechaInicio || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaInicio: e.target.value || undefined,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={filters.fechaFin || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaFin: e.target.value || undefined,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Período (YYYY-MM)</Label>
                <Input
                  type="month"
                  value={filters.periodo || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      periodo: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Filtros de Unidad y Usuario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {filters.unidadId
                        ? unidades.find((u) => u.id === filters.unidadId)
                            ?.identificador || "Seleccionar unidad"
                        : "Todas las unidades"}
                      <IconFilter className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          unidadId: undefined,
                        }))
                      }
                    >
                      Todas las unidades
                    </DropdownMenuItem>
                    {unidades.map((unidad) => (
                      <DropdownMenuItem
                        key={unidad.id}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            unidadId: unidad.id,
                          }))
                        }
                      >
                        {unidad.identificador}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label>Usuario ID</Label>
                <Input
                  type="text"
                  placeholder="ID del usuario (opcional)"
                  value={filters.userId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      userId: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Filtros de Estado */}
            {hasEstadosFilter && (
              <div className="space-y-2">
                <Label>Estados</Label>
                <div className="flex flex-wrap gap-3 p-3 border rounded-md">
                  {estadosOptions.map((estado) => (
                    <div
                      key={estado}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`estado-${estado}`}
                        checked={selectedEstados.includes(estado)}
                        onCheckedChange={() => handleEstadoToggle(estado)}
                      />
                      <Label
                        htmlFor={`estado-${estado}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {estado}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incluir Detalles */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-detalles"
                checked={filters.incluirDetalles || false}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    incluirDetalles: checked as boolean,
                  }))
                }
              />
              <Label
                htmlFor="incluir-detalles"
                className="text-sm font-normal cursor-pointer"
              >
                Incluir detalles adicionales
              </Label>
            </div>

            {/* Botón Generar */}
            <div className="flex justify-end">
              <Button
                onClick={generarReporte}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <IconRefresh className="size-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <IconFileDownload className="size-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados del Reporte */}
      {reporteData && filters.formato === "JSON" && (
        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Reporte</CardTitle>
              <CardDescription>
                Generado el {formatDate(reporteData.fechaGeneracion)} -{" "}
                {reporteData.periodo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(reporteData.resumen).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {typeof value === "number"
                        ? value.toLocaleString("es-CO")
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Total de registros: {reporteData.total}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Datos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Datos del Reporte</CardTitle>
                  <CardDescription>
                    {reporteData.total} registros encontrados
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Generar CSV con los mismos filtros
                    const tempFormato = filters.formato;
                    setFilters((prev) => ({ ...prev, formato: "CSV" }));
                    await generarReporte();
                    setFilters((prev) => ({ ...prev, formato: tempFormato }));
                  }}
                  className="gap-2"
                >
                  <IconFileDownload className="size-4" />
                  Descargar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reporteData.datos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos para mostrar
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(reporteData.datos[0]).map((key) => (
                          <th
                            key={key}
                            className="text-left p-3 font-semibold text-sm"
                          >
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .replace(/^\w/, (c) => c.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reporteData.datos.slice(0, 100).map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-muted/50"
                        >
                          {Object.values(row).map((value: any, colIdx) => (
                            <td key={colIdx} className="p-3 text-sm">
                              {typeof value === "number" &&
                              value > 1000 &&
                              !String(value).includes(".")
                                ? formatCurrency(value)
                                : typeof value === "string" &&
                                  value.match(/^\d{4}-\d{2}-\d{2}/)
                                ? formatDate(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reporteData.datos.length > 100 && (
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      Mostrando los primeros 100 de {reporteData.total}{" "}
                      registros. Descarga el CSV para ver todos los datos.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportesPage;
