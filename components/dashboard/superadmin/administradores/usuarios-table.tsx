"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconUser, IconSearch, IconFilter, IconX } from "@tabler/icons-react";
import type { Usuario } from "@/types/users";

interface UsuariosTableProps {
  condominioId: string | null;
}

interface UsuariosFilters {
  name?: string;
  role?: string;
  numeroDocumento?: string;
}

export function UsuariosTable({ condominioId }: UsuariosTableProps) {
  const { subdomain } = useSubdomain();
  const [filters, setFilters] = useState<UsuariosFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: usuarios = [],
    isLoading,
    error,
  } = useQuery<Usuario[]>({
    queryKey: ["usuarios", condominioId],
    queryFn: async () => {
      if (!condominioId) return [];
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(
        `/condominios/${condominioId}/users`
      );
      return response.data;
    },
    enabled: !!condominioId,
  });

  // Filtrar usuarios por filtros específicos y búsqueda general
  const filteredUsuarios = usuarios.filter((usuario) => {
    // Filtro por nombre
    if (
      filters.name &&
      !usuario.name.toLowerCase().includes(filters.name.toLowerCase())
    ) {
      return false;
    }

    // Filtro por rol
    if (filters.role && usuario.role !== filters.role) {
      return false;
    }

    // Filtro por número de documento
    if (filters.numeroDocumento) {
      const doc = usuario.numeroDocumento || "";
      if (!doc.toLowerCase().includes(filters.numeroDocumento.toLowerCase())) {
        return false;
      }
    }

    // Búsqueda general (busca en nombre y número de documento)
    if (
      debouncedSearchTerm &&
      !filters.name &&
      !filters.role &&
      !filters.numeroDocumento
    ) {
      const search = debouncedSearchTerm.toLowerCase();
      return (
        usuario.name.toLowerCase().includes(search) ||
        (usuario.numeroDocumento &&
          usuario.numeroDocumento.toLowerCase().includes(search))
      );
    }

    return true;
  });

  // Obtener roles únicos para el filtro
  const uniqueRoles = Array.from(new Set(usuarios.map((u) => u.role))).sort();

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  if (!condominioId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconUser className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Selecciona un condominio para ver sus usuarios
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Usuarios del Condominio</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Cargando..."
                  : `${filteredUsuarios.length} usuario${
                      filteredUsuarios.length !== 1 ? "s" : ""
                    } encontrado${filteredUsuarios.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros ({activeFiltersCount})
              </Button>
            )}
          </div>

          {condominioId && usuarios.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Buscar por nombre o número de documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, role: undefined }))
                    }
                  >
                    Todos
                  </DropdownMenuItem>
                  {uniqueRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setFilters((prev) => ({ ...prev, role }))}
                    >
                      {role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los usuarios. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconUser className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "No se encontraron usuarios con los filtros aplicados"
                : "No se encontraron usuarios para este condominio"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-xs font-medium">Usuario</th>
                  <th className="text-left p-4 text-xs font-medium">Rol</th>
                  <th className="text-left p-4 text-xs font-medium">
                    Número de Documento
                  </th>
                  <th className="text-left p-4 text-xs font-medium">
                    Teléfono
                  </th>
                  <th className="text-left p-4 text-xs font-medium">
                    Fecha de Creación
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <IconUser className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {usuario.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">
                        {usuario.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {usuario.numeroDocumento || (
                          <span className="text-muted-foreground">
                            No disponible
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {usuario.telefono || (
                          <span className="text-muted-foreground">
                            No disponible
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm whitespace-nowrap">
                        {new Date(usuario.createdAt).toLocaleDateString(
                          "es-CO",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
