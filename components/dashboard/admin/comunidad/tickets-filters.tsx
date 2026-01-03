"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconFilter, IconX } from "@tabler/icons-react";
import type { TicketEstado } from "@/types/types";

export interface TicketsFilters {
  page: number;
  limit: number;
  estado?: TicketEstado;
  categoria?: string;
  userId?: string;
  unidadId?: string;
}

interface TicketsFiltersComponentProps {
  filters: TicketsFilters;
  unidades: Array<{ id: string; identificador: string }>;
  onEstadoFilter: (estado: TicketEstado | null) => void;
  onCategoriaFilter: (categoria: string | null) => void;
  onUnidadFilter: (unidadId: string | null) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ESTADO_OPTIONS: { value: TicketEstado; label: string }[] = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CERRADO", label: "Cerrado" },
];

const CATEGORIA_OPTIONS = [
  "Iluminación",
  "Poda",
  "Limpieza",
  "Plomería",
  "Electricidad",
  "Seguridad",
  "Otro",
];

export function TicketsFiltersComponent({
  filters,
  unidades,
  onEstadoFilter,
  onCategoriaFilter,
  onUnidadFilter,
  onClearFilters,
  activeFiltersCount,
}: TicketsFiltersComponentProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="size-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtra los tickets según tus necesidades
            </CardDescription>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <IconX className="size-4" />
              Limpiar ({activeFiltersCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <select
              value={filters.estado || ""}
              onChange={(e) =>
                onEstadoFilter(
                  e.target.value ? (e.target.value as TicketEstado) : null
                )
              }
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos los estados</option>
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Categoría</label>
            <select
              value={filters.categoria || ""}
              onChange={(e) =>
                onCategoriaFilter(e.target.value || null)
              }
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIA_OPTIONS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Unidad</label>
            <select
              value={filters.unidadId || ""}
              onChange={(e) => onUnidadFilter(e.target.value || null)}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas las unidades</option>
              {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {unidad.identificador}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

