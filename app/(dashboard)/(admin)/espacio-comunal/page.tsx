"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type { EspacioComun, EspacioComunTipo } from "@/types/types";
import { EspaciosTable } from "@/components/dashboard/admin/espacios-comunes/espacios-table";
import { EspaciosFiltersComponent, type EspaciosFilters } from "@/components/dashboard/admin/espacios-comunes/espacios-filters";
import { CreateEspacioDialog } from "@/components/dashboard/admin/espacios-comunes/create-espacio-dialog";
import { EditEspacioDialog } from "@/components/dashboard/admin/espacios-comunes/edit-espacio-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";

function EspacioComunalPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEspacio, setSelectedEspacio] = useState<EspacioComun | null>(null);
  const [filters, setFilters] = useState<EspaciosFilters>({
    page: 1,
    limit: 10,
  });

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.tipo) queryParams.append("tipo", filters.tipo);
  if (filters.activo !== undefined) queryParams.append("activo", String(filters.activo));
  
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/reservas/espacios${queryString ? `?${queryString}` : ""}`;

  // Obtener espacios comunes
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<EspacioComun[] | {
    data: EspacioComun[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["espacios-comunes", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  // Manejar diferentes formatos de respuesta
  let espacios: EspacioComun[] = [];
  let total = 0;
  let currentPage = page;
  let totalPages = 0;
  let limitValue = limit;

  if (response) {
    if (Array.isArray(response)) {
      espacios = response;
      total = response.length;
      totalPages = 1;
    } else if (response.data && Array.isArray(response.data)) {
      espacios = response.data;
      total = response.total ?? response.data.length;
      currentPage = response.page ?? page;
      totalPages = response.totalPages ?? Math.ceil(total / limit);
      limitValue = response.limit ?? limit;
    }
  }

  // Mutación para eliminar espacio
  const deleteMutation = useMutation({
    mutationFn: async (espacioId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/reservas/espacios/${espacioId}`);
    },
    onSuccess: () => {
      toast.success("Espacio común eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["espacios-comunes"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el espacio común";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleEdit = (espacio: EspacioComun) => {
    setSelectedEspacio(espacio);
    setEditDialogOpen(true);
  };

  const handleDelete = (espacio: EspacioComun) => {
    deleteMutation.mutate(espacio.id);
  };

  const handleTipoFilter = (tipo: EspacioComunTipo | null) => {
    setFilters((prev) => ({
      ...prev,
      tipo: tipo || undefined,
      page: 1,
    }));
  };

  const handleActivoFilter = (activo: boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      activo: activo !== null ? activo : undefined,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Contar filtros activos
  const activeFiltersCount = [
    filters.tipo,
    filters.activo !== undefined ? filters.activo : null,
  ].filter((v) => v !== null && v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-y-2">
        <div>
          <h1 className="text-3xl font-bold">Espacios Comunes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los espacios comunes disponibles para reservas
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 w-full sm:w-auto"
        >
          <IconCirclePlusFilled className="size-4" />
          Crear Espacio Común
        </Button>
      </div>

      <EspaciosFiltersComponent
        filters={filters}
        onTipoFilter={handleTipoFilter}
        onActivoFilter={handleActivoFilter}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <EspaciosTable
        espacios={espacios}
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

      <CreateEspacioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditEspacioDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedEspacio(null);
          }
        }}
        espacio={selectedEspacio}
      />
    </div>
  );
}

export default EspacioComunalPage;
