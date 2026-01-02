"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { EspacioComunTipo } from "@/types/types";

export interface EspaciosFilters {
  page?: number;
  limit?: number;
  tipo?: EspacioComunTipo;
  activo?: boolean;
}

interface EspaciosFiltersProps {
  filters: EspaciosFilters;
  onTipoFilter: (tipo: EspacioComunTipo | null) => void;
  onActivoFilter: (activo: boolean | null) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const TIPO_OPTIONS: { value: EspacioComunTipo; label: string }[] = [
  { value: "SALON_SOCIAL", label: "Salón Social" },
  { value: "ZONA_BBQ", label: "Zona BBQ" },
  { value: "SAUNA", label: "Sauna" },
  { value: "CASA_EVENTOS", label: "Casa de Eventos" },
  { value: "GIMNASIO", label: "Gimnasio" },
  { value: "PISCINA", label: "Piscina" },
  { value: "CANCHA_DEPORTIVA", label: "Cancha Deportiva" },
  { value: "PARQUEADERO", label: "Parqueadero" },
  { value: "OTRO", label: "Otro" },
];

export function EspaciosFiltersComponent({
  filters,
  onTipoFilter,
  onActivoFilter,
  onClearFilters,
  activeFiltersCount,
}: EspaciosFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Filtra espacios comunes por tipo o estado
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
          {/* Filtro por tipo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconFilter className="size-4" />
                Tipo
                {filters.tipo && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onTipoFilter(null)}>
                Todos
              </DropdownMenuItem>
              {TIPO_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onTipoFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por estado activo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconFilter className="size-4" />
                Estado
                {filters.activo !== undefined && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onActivoFilter(null)}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActivoFilter(true)}>
                Activos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActivoFilter(false)}>
                Inactivos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

