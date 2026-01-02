"use client";

import { useState } from "react";
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
import type { Residente, Unidad } from "@/types/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface ResidentesFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  unidadId?: string;
}

interface ResidentesFiltersProps {
  filters: ResidentesFilters;
  searchText: string;
  unidades: Unidad[];
  onSearchTextChange: (value: string) => void;
  onRoleFilter: (role: string | null) => void;
  onUnidadFilter: (unidadId: string | null) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ROLE_OPTIONS = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "RESIDENTE", label: "Residente" },
];

export function ResidentesFiltersComponent({
  filters,
  searchText,
  unidades,
  onSearchTextChange,
  onRoleFilter,
  onUnidadFilter,
  onClearFilters,
  activeFiltersCount,
}: ResidentesFiltersProps) {
  const [unidadComboboxOpen, setUnidadComboboxOpen] = useState(false);

  const selectedUnidad = filters.unidadId
    ? unidades.find((unidad) => unidad.id === filters.unidadId)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>
              Busca y filtra residentes por nombre, cédula, unidad o rol
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
          {/* Búsqueda por nombre, email o número de documento */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Buscar por nombre, email o cédula..."
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filtro por rol */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconFilter className="size-4" />
                Rol
                {filters.role && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onRoleFilter(null)}>
                Todos
              </DropdownMenuItem>
              {ROLE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onRoleFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por unidad - Combobox */}
          <Popover open={unidadComboboxOpen} onOpenChange={setUnidadComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={unidadComboboxOpen}
                className="gap-2 min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <IconFilter className="size-4" />
                  <span>Unidad</span>
                  {filters.unidadId && (
                    <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar unidad..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No se encontraron unidades.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onUnidadFilter(null);
                        setUnidadComboboxOpen(false);
                      }}
                    >
                      Todas las unidades
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          !filters.unidadId ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup>
                    {unidades.map((unidad) => (
                      <CommandItem
                        key={unidad.id}
                        value={`${unidad.identificador} ${unidad.tipo}`}
                        onSelect={() => {
                          onUnidadFilter(unidad.id);
                          setUnidadComboboxOpen(false);
                        }}
                      >
                        {unidad.identificador} - {unidad.tipo}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            filters.unidadId === unidad.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}

