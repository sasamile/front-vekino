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
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import type { UnidadTipo, UnidadEstado } from "@/types/types";

export interface UnidadesFilters {
  page?: number;
  limit?: number;
  identificador?: string;
  tipo?: UnidadTipo;
  estado?: UnidadEstado;
}

interface UnidadesFiltersProps {
  filters: UnidadesFilters;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onTipoFilter: (tipo: UnidadTipo | null) => void;
  onEstadoFilter: (estado: UnidadEstado | null) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const TIPO_OPTIONS: { value: UnidadTipo; label: string }[] = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial" },
];

const ESTADO_OPTIONS: { value: UnidadEstado; label: string }[] = [
  { value: "VACIA", label: "Vacía" },
  { value: "OCUPADA", label: "Ocupada" },
  { value: "EN_MANTENIMIENTO", label: "En Mantenimiento" },
];

export function UnidadesFiltersComponent({
  filters,
  searchText,
  onSearchTextChange,
  onTipoFilter,
  onEstadoFilter,
  onClearFilters,
  activeFiltersCount,
}: UnidadesFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Busca y filtra unidades por identificador, tipo o estado
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
          {/* Búsqueda por identificador */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Buscar por identificador..."
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
}

