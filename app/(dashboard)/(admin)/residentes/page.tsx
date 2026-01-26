"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  Residente,
  Unidad,
  UnidadWithResidentesResponse,
} from "@/types/types";
import { ResidentesTable } from "@/components/dashboard/admin/residentes/residentes-table";
import {
  ResidentesFiltersComponent,
  type ResidentesFilters,
} from "@/components/dashboard/admin/residentes/residentes-filters";
import { CreateResidenteDialog } from "@/components/dashboard/admin/residentes/create-residente-dialog";
import { ViewResidenteDialog } from "@/components/dashboard/admin/residentes/view-residente-dialog";
import { EditResidenteDialog } from "@/components/dashboard/admin/residentes/edit-residente-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled, IconFileText } from "@tabler/icons-react";

function ResidentesPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedResidente, setSelectedResidente] = useState<Residente | null>(
    null,
  );
  const [filters, setFilters] = useState<ResidentesFilters>({
    page: 1,
    limit: 10,
  });
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 500);

  // Actualizar filtros cuando cambia el debounce
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearchText.trim() || undefined,
      page: 1,
    }));
  }, [debouncedSearchText]);

  // Construir query params para el endpoint
  const queryParams = new URLSearchParams();
  if (filters.search) {
    const searchTrimmed = filters.search.trim();
    const isNumeric = /^\d+$/.test(searchTrimmed);
    if (isNumeric) {
      queryParams.append("numeroDocumento", searchTrimmed);
    } else {
      queryParams.append("nombre", searchTrimmed);
    }
  }

  const queryString = queryParams.toString();
  const endpoint = `/unidades/with-residentes${queryString ? `?${queryString}` : ""}`;

  // Obtener unidades con residentes
  const {
    data: unidadesData,
    isLoading,
    error,
  } = useQuery<UnidadWithResidentesResponse[]>({
    queryKey: ["unidades-with-residentes", filters.search],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Extraer todos los residentes de todas las unidades y aplicar filtros adicionales
  let allResidentes: Residente[] = [];
  console.log(unidadesData);

  if (unidadesData && Array.isArray(unidadesData)) {
    allResidentes = unidadesData.flatMap((unidad) =>
      (unidad.usuarios || []).map((usuario: Residente) => ({
        ...usuario,
        unidadId: unidad.id,
      })),
    );

    if (filters.role) {
      allResidentes = allResidentes.filter((r) => r.role === filters.role);
    }

    if (filters.unidadId) {
      allResidentes = allResidentes.filter(
        (r) => r.unidadId === filters.unidadId,
      );
    }
  }

  // Aplicar paginación
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const total = allResidentes.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const residentes = allResidentes.slice(startIndex, endIndex);
  const currentPage = page;
  const limitValue = limit;

  // Obtener unidades para mostrar en la tabla
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Mutación para eliminar residente
  const deleteMutation = useMutation({
    mutationFn: async (residenteId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/condominios/users/${residenteId}`);
    },
    onSuccess: () => {
      toast.success("Residente eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["unidades-with-residentes"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el residente";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleView = (residente: Residente) => {
    setSelectedResidente(residente);
    setViewDialogOpen(true);
  };

  const handleEdit = (residente: Residente) => {
    setSelectedResidente(residente);
    setEditDialogOpen(true);
  };

  const handleDelete = (residente: Residente) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar al residente "${residente.name}"?`,
      )
    ) {
      deleteMutation.mutate(residente.id);
    }
  };

  const handleRoleFilter = (role: string | null) => {
    setFilters((prev) => ({
      ...prev,
      role: role || undefined,
      page: 1,
    }));
  };

  const handleUnidadFilter = (unidadId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      unidadId: unidadId || undefined,
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
    filters.search,
    filters.role,
    filters.unidadId,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-y-2">
        <div>
          <h1 className="text-3xl font-bold">Residentes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y administra todos los residentes del condominio
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
            asChild
          >
            <Link href="/residentes/carga-masiva">
              <IconFileText className="size-4" />
              Carga Masiva
            </Link>
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 flex-1 sm:flex-none"
          >
            <IconCirclePlusFilled className="size-4" />
            Crear Residente
          </Button>
        </div>
      </div>

      <ResidentesFiltersComponent
        filters={filters}
        searchText={searchText}
        unidades={unidades}
        onSearchTextChange={setSearchText}
        onRoleFilter={handleRoleFilter}
        onUnidadFilter={handleUnidadFilter}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <ResidentesTable
        residentes={residentes}
        unidades={unidades}
        isLoading={isLoading}
        error={error}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limitValue}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <CreateResidenteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ViewResidenteDialog
        open={viewDialogOpen}
        onOpenChange={(open: boolean) => {
          setViewDialogOpen(open);
          if (!open) {
            setSelectedResidente(null);
          }
        }}
        residente={selectedResidente}
        unidades={unidades}
      />

      <EditResidenteDialog
        open={editDialogOpen}
        onOpenChange={(open: boolean) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedResidente(null);
          }
        }}
        residente={selectedResidente}
      />
    </div>
  );
}

export default ResidentesPage;
