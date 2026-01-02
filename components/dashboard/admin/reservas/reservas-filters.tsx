"use client";

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
import type { ReservaEstado, EspacioComun } from "@/types/types";

export interface ReservasFilters {
  page?: number;
  limit?: number;
  estado?: ReservaEstado;
  espacioComunId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface ReservasFiltersProps {
  filters: ReservasFilters;
  espacios: EspacioComun[];
  onEstadoFilter: (estado: ReservaEstado | null) => void;
  onEspacioFilter: (espacioId: string | null) => void;
  onFechaDesdeChange: (fecha: string) => void;
  onFechaHastaChange: (fecha: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ESTADO_OPTIONS: { value: ReservaEstado; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "COMPLETADA", label: "Completada" },
];

export function ReservasFiltersComponent({
  filters,
  espacios,
  onEstadoFilter,
  onEspacioFilter,
  onFechaDesdeChange,
  onFechaHastaChange,
  onClearFilters,
  activeFiltersCount,
}: ReservasFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Filtra reservas por estado, espacio o rango de fechas
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

          {/* Filtro por espacio */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px]">
                <IconFilter className="size-4" />
                Espacio
                {filters.espacioComunId && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem onClick={() => onEspacioFilter(null)}>
                Todos
              </DropdownMenuItem>
              {espacios.map((espacio) => (
                <DropdownMenuItem
                  key={espacio.id}
                  onClick={() => onEspacioFilter(espacio.id)}
                >
                  {espacio.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por fecha desde */}
          <div className="flex-1 min-w-[180px]">
            <Input
              type="datetime-local"
              placeholder="Fecha desde"
              value={filters.fechaDesde || ""}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por fecha hasta */}
          <div className="flex-1 min-w-[180px]">
            <Input
              type="datetime-local"
              placeholder="Fecha hasta"
              value={filters.fechaHasta || ""}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

