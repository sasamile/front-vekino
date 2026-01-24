"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Unidad, UnidadTipo, UnidadEstado } from "@/types/types";
import { UnidadesTable } from "@/components/dashboard/admin/unidades/unidades-table";
import { UnidadesFiltersComponent, type UnidadesFilters } from "@/components/dashboard/admin/unidades/unidades-filters";
import { CreateUnidadDialog } from "@/components/dashboard/admin/unidades/create-unidad-dialog";
import { EditUnidadDialog } from "@/components/dashboard/admin/unidades/edit-unidad-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";

function UnidadesPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [filters, setFilters] = useState<UnidadesFilters>({
    page: 1,
    limit: 10,
  });
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 500);

  // Actualizar filtros cuando cambia el debounce
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      identificador: debouncedSearchText.trim() || undefined,
      page: 1,
    }));
  }, [debouncedSearchText]);

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.identificador) queryParams.append("identificador", filters.identificador);
  if (filters.tipo) queryParams.append("tipo", filters.tipo);
  if (filters.estado) queryParams.append("estado", filters.estado);
  
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/unidades${queryString ? `?${queryString}` : ""}`;

  // Obtener unidades
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<Unidad[] | {
    data: Unidad[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["unidades", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  // Manejar diferentes formatos de respuesta
  let unidades: Unidad[] = [];
  let total = 0;
  let currentPage = page;
  let totalPages = 0;
  let limitValue = limit;

  if (response) {
    if (Array.isArray(response)) {
      unidades = response;
      total = response.length;
      totalPages = 1;
    } else if (response.data && Array.isArray(response.data)) {
      unidades = response.data;
      total = response.total ?? response.data.length;
      currentPage = response.page ?? page;
      totalPages = response.totalPages ?? Math.ceil(total / limit);
      limitValue = response.limit ?? limit;
    }
  }

  // Mutación para eliminar unidad
  const deleteMutation = useMutation({
    mutationFn: async (unidadId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/unidades/${unidadId}`);
    },
    onSuccess: () => {
      toast.success("Unidad eliminada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar la unidad";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleEdit = (unidad: Unidad) => {
    setSelectedUnidad(unidad);
    setEditDialogOpen(true);
  };

  const handleDelete = (unidad: Unidad) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar la unidad "${unidad.identificador}"?`
      )
    ) {
      deleteMutation.mutate(unidad.id);
    }
  };

  const handleTipoFilter = (tipo: UnidadTipo | null) => {
    setFilters((prev) => ({
      ...prev,
      tipo: tipo || undefined,
      page: 1,
    }));
  };

  const handleEstadoFilter = (estado: UnidadEstado | null) => {
    setFilters((prev) => ({
      ...prev,
      estado: estado || undefined,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setSearchText("");
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Contar filtros activos
  const activeFiltersCount = [
    filters.identificador,
    filters.tipo,
    filters.estado,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-y-2">
        <div>
          <h1 className="text-3xl font-bold">Unidades</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y administra todas las unidades del condominio
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 w-full sm:w-auto"
        >
          <IconCirclePlusFilled className="size-4" />
          Crear Unidad
        </Button>
      </div>

      <UnidadesFiltersComponent
        filters={filters}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onTipoFilter={handleTipoFilter}
        onEstadoFilter={handleEstadoFilter}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <UnidadesTable
        unidades={unidades}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limitValue}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <CreateUnidadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditUnidadDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedUnidad(null);
          }
        }}
        unidad={selectedUnidad}
      />
    </div>
  );
}

export default UnidadesPage;
