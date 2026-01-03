"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconFilter,
} from "@tabler/icons-react";
import type { FacturaEstado } from "@/types/types";

export interface FacturasFilters {
  page?: number;
  limit?: number;
  unidadId?: string;
  userId?: string;
  periodo?: string;
  estado?: FacturaEstado;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
}

interface FacturasFiltersProps {
  filters: FacturasFilters;
  unidades: Array<{ id: string; identificador: string }>;
  onUnidadFilter: (unidadId: string | null) => void;
  onPeriodoFilter: (periodo: string) => void;
  onEstadoFilter: (estado: FacturaEstado | null) => void;
  onFechaVencimientoDesdeChange: (fecha: string) => void;
  onFechaVencimientoHastaChange: (fecha: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ESTADO_OPTIONS: { value: FacturaEstado; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "PAGADA", label: "Pagada" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function FacturasFiltersComponent({
  filters,
  unidades,
  onUnidadFilter,
  onPeriodoFilter,
  onEstadoFilter,
  onFechaVencimientoDesdeChange,
  onFechaVencimientoHastaChange,
  onClearFilters,
  activeFiltersCount,
}: FacturasFiltersProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [periodoInput, setPeriodoInput] = useState(filters.periodo || "");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setPeriodoInput(filters.periodo || "");
  }, [filters.periodo]);

  const handlePeriodoChange = (value: string) => {
    setPeriodoInput(value);
    if (value.match(/^\d{4}-\d{2}$/)) {
      onPeriodoFilter(value);
    } else if (value === "") {
      onPeriodoFilter("");
    }
  };

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros de Búsqueda</CardTitle>
              <CardDescription>
                Filtra facturas por unidad, período, estado o rango de fechas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
            <div className="flex-1 min-w-[180px] h-9 bg-muted animate-pulse rounded-md" />
            <div className="flex-1 min-w-[180px] h-9 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Filtra facturas por unidad, período, estado o rango de fechas
            </CardDescription>
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Limpiar filtros ({activeFiltersCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {/* Filtro por estado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconFilter className="size-4" />
                Estado
                {filters.estado && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEstadoFilter(null)}>
                Todos
              </DropdownMenuItem>
              {ESTADO_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onEstadoFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por unidad */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px]">
                <IconFilter className="size-4" />
                Unidad
                {filters.unidadId && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem onClick={() => onUnidadFilter(null)}>
                Todas
              </DropdownMenuItem>
              {unidades.map((unidad) => (
                <DropdownMenuItem
                  key={unidad.id}
                  onClick={() => onUnidadFilter(unidad.id)}
                >
                  {unidad.identificador}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por período */}
          <div className="min-w-[140px]">
            <Input
              type="month"
              placeholder="Período (YYYY-MM)"
              value={periodoInput}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por fecha vencimiento desde */}
          <div className="flex-1 min-w-[180px]">
            <Input
              type="date"
              placeholder="Fecha vencimiento desde"
              value={filters.fechaVencimientoDesde || ""}
              onChange={(e) => onFechaVencimientoDesdeChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por fecha vencimiento hasta */}
          <div className="flex-1 min-w-[180px]">
            <Input
              type="date"
              placeholder="Fecha vencimiento hasta"
              value={filters.fechaVencimientoHasta || ""}
              onChange={(e) => onFechaVencimientoHastaChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


