"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
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
import {
  IconUser,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconEye,
  IconEdit,
  IconCirclePlusFilled,
} from "@tabler/icons-react";
import type { Usuario } from "@/types/users";
import type { PaginatedResponse } from "@/types/condominios";
import Image from "next/image";

interface UsuariosTableProps {
  condominioId: string | null;
  onView?: (usuario: Usuario) => void;
  onEdit?: (usuario: Usuario) => void;
  onCreate?: () => void;
}

interface UsuariosFilters {
  search?: string;
  role?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

// Función para traducir roles
const translateRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: "Administrador",
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE: "Residente",
  };
  return roleMap[role] || role;
};

export function UsuariosTable({
  condominioId,
  onView,
  onEdit,
  onCreate,
}: UsuariosTableProps) {
  const { subdomain } = useSubdomain();
  const [filters, setFilters] = useState<UsuariosFilters>({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Actualizar filtros cuando cambia el debounce
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearchTerm || undefined,
      page: 1, // Resetear a la primera página cuando cambia la búsqueda
    }));
  }, [debouncedSearchTerm]);

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.role) queryParams.append("role", filters.role);
  if (filters.active !== undefined)
    queryParams.append("active", String(filters.active));

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = condominioId
    ? `/condominios/${condominioId}/users${
        queryString ? `?${queryString}` : ""
      }`
    : "";

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<PaginatedResponse<Usuario>>({
    queryKey: ["usuarios", condominioId, filters],
    queryFn: async () => {
      if (!condominioId) {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
    enabled: !!condominioId,
  });

  const usuarios = response?.data || [];
  const total = response?.total || 0;
  const currentPage = response?.page || 1;
  const totalPages = response?.totalPages || 0;
  const limitValue = response?.limit || 10;

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setSearchTerm("");
  };

  const activeFiltersCount = [
    filters.search,
    filters.role,
    filters.active !== undefined ? filters.active : undefined,
  ].filter((v) => v !== undefined).length;

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRoleFilter = (role: string | null) => {
    setFilters((prev) => ({
      ...prev,
      role: role || undefined,
      page: 1, // Resetear a la primera página cuando cambia el filtro
    }));
  };

  const handleActiveFilter = (active: boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      active: active === null ? undefined : active,
      page: 1, // Resetear a la primera página cuando cambia el filtro
    }));
  };

  if (!condominioId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 h-[calc(100vh-20.2rem)] ">
          <div className="text-center justify-center items-center flex flex-col">
            <Image
              src={"/img/condominio.png"}
              width={200}
              height={100}
              alt="condominios"
            />
            <p className="text-muted-foreground">
              Selecciona un condominio para ver sus usuarios
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full max-w-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="py-2">Usuarios del Condominio</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Cargando..."
                  : total > 0
                  ? `${total} usuario${total !== 1 ? "s" : ""} encontrado${
                      total !== 1 ? "s" : ""
                    } - Página ${currentPage} de ${totalPages}`
                  : "No se encontraron usuarios"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros ({activeFiltersCount})
                </Button>
              )}
              {condominioId && onCreate && (
                <Button onClick={onCreate} className="gap-2">
                  <IconCirclePlusFilled className="size-4" />
                  Crear Usuario
                </Button>
              )}
            </div>
          </div>

          {condominioId && (
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Buscar por nombre, email o número de documento..."
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
                  <DropdownMenuItem onClick={() => handleRoleFilter(null)}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleFilter("ADMIN")}>
                    Administrador
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleFilter("PROPIETARIO")}
                  >
                    Propietario
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleFilter("ARRENDATARIO")}
                  >
                    Arrendatario
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleFilter("RESIDENTE")}
                  >
                    Residente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <IconFilter className="size-4" />
                    Estado
                    {filters.active !== undefined && (
                      <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                        {filters.active ? "✓" : "✗"}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleActiveFilter(null)}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleActiveFilter(true)}>
                    Activos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleActiveFilter(false)}>
                    Inactivos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0 w-full max-w-full">
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
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconUser className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filters.role || filters.active !== undefined
                ? "No se encontraron usuarios con los filtros aplicados"
                : "No se encontraron usuarios para este condominio"}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full max-w-full">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-xs font-medium">
                        Usuario
                      </th>
                      <th className="text-left p-4 text-xs font-medium">Rol</th>
                      <th className="text-left p-4 text-xs font-medium">
                        Número de Documento
                      </th>
                      <th className="text-left p-4 text-xs font-medium">
                        Estado
                      </th>

                      {(onView || onEdit) && (
                        <th className="text-left p-4 text-xs font-medium">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="border-b hover:bg-accent/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {usuario.image ? (
                              <div className="size-10 rounded-full overflow-hidden shrink-0">
                                <Image
                                  src={usuario.image}
                                  alt={usuario.name}
                                  width={40}
                                  height={40}
                                  className="object-cover rounded-full"
                                />
                              </div>
                            ) : (
                              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <IconUser className="size-5 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {usuario.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {usuario.role === "ADMIN" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              {translateRole(usuario.role)}
                            </span>
                          ) : (
                            <span className="text-sm font-medium">
                              {translateRole(usuario.role)}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs">
                            {usuario.numeroDocumento || (
                              <span className="text-muted-foreground">
                                No disponible
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              usuario.active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {usuario.active ? (
                              <IconCheck className="size-3.5" />
                            ) : (
                              <IconX className="size-3.5" />
                            )}
                            {usuario.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {(onView || onEdit) && (
                          <td className="p-4">
                            <div className="flex gap-2">
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => onView(usuario)}
                                >
                                  <IconEye className="size-4" />
                                  Ver
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => onEdit(usuario)}
                                >
                                  <IconEdit className="size-4" />
                                  Editar
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * limitValue + 1} -{" "}
                  {Math.min(currentPage * limitValue, total)} de {total}{" "}
                  usuarios
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <IconChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className="min-w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Siguiente
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
