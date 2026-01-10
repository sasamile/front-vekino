"use client";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconFilter,
  IconFileDownload,
  IconFileText,
  IconRefresh,
} from "@tabler/icons-react";
import type { Unidad } from "@/types/types";
import type { TipoReporte } from "./constants";
import { TIPO_REPORTE_OPTIONS, getEstadosOptions } from "./constants";
import { ReporteFilters } from "./generar-reporte";

interface FiltrosReporteProps {
  filters: ReporteFilters;
  unidades: Unidad[];
  selectedEstados: string[];
  onFiltersChange: (filters: ReporteFilters) => void;
  onEstadoToggle: (estado: string) => void;
  onEstadoReset: () => void;
  onGenerar: () => void;
  isGenerating: boolean;
}

export function FiltrosReporte({
  filters,
  unidades,
  selectedEstados,
  onFiltersChange,
  onEstadoToggle,
  onEstadoReset,
  onGenerar,
  isGenerating,
}: FiltrosReporteProps) {
  const estadosOptions = getEstadosOptions(filters.tipoReporte);
  const hasEstadosFilter = estadosOptions.length > 0;

  const handleTipoReporteChange = (tipo: TipoReporte) => {
    onFiltersChange({
      ...filters,
      tipoReporte: tipo,
      estados: undefined,
    });
    onEstadoReset();
  };

  return (
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
                      onFiltersChange({ ...filters, formato: "JSON" })
                    }
                  >
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onFiltersChange({ ...filters, formato: "CSV" })
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
                  onFiltersChange({
                    ...filters,
                    fechaInicio: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={filters.fechaFin || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    fechaFin: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Período (YYYY-MM)</Label>
              <Input
                type="month"
                value={filters.periodo || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    periodo: e.target.value || undefined,
                  })
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
                      onFiltersChange({ ...filters, unidadId: undefined })
                    }
                  >
                    Todas las unidades
                  </DropdownMenuItem>
                  {unidades.map((unidad) => (
                    <DropdownMenuItem
                      key={unidad.id}
                      onClick={() =>
                        onFiltersChange({ ...filters, unidadId: unidad.id })
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
                  onFiltersChange({
                    ...filters,
                    userId: e.target.value || undefined,
                  })
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
                      onCheckedChange={() => onEstadoToggle(estado)}
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
                onFiltersChange({
                  ...filters,
                  incluirDetalles: checked as boolean,
                })
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
              onClick={onGenerar}
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
  );
}

