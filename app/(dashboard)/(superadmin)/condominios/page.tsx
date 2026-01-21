"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import axios from "axios";
import { useDebounce } from "@/hooks/use-debounce";
import toast from "react-hot-toast";
import type { Condominio } from "@/types/types";
import type {
  CondominiosFilters,
  PaginatedResponse,
} from "@/types/condominios";
import { CondominiosFiltersComponent } from "@/components/dashboard/superadmin/condominios/condominios-filters";
import { CondominiosTable } from "@/components/dashboard/superadmin/condominios/condominios-table";
import { ViewCondominioDialog } from "@/components/dashboard/superadmin/condominios/view-condominio-dialog";
import { EditCondominioDialog } from "@/components/dashboard/superadmin/condominios/edit-condominio-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { CreateCondominioDialog } from "@/components/dashboard/sidebar/create-condominio-dialog";

function SuperAdminCondominiosPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CondominiosFilters>({
    page: 1,
    limit: 5,
  });
  const [searchName, setSearchName] = useState("");
  const debouncedSearchName = useDebounce(searchName, 300);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [selectedCondominio, setSelectedCondominio] =
    useState<Condominio | null>(null);

  // Actualizar filtros cuando cambia el debounce
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearchName || undefined,
      page: 1, // Resetear a la primera página cuando cambia la búsqueda
    }));
  }, [debouncedSearchName]);

  // Construir query params - Todos los parámetros soportados por el backend
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.isActive !== undefined)
    queryParams.append("isActive", String(filters.isActive));
  if (filters.subscriptionPlan)
    queryParams.append("subscriptionPlan", filters.subscriptionPlan);
  if (filters.city) queryParams.append("city", filters.city);

  // Valores por defecto según la documentación del backend
  const page = filters.page || 1;
  const limit = filters.limit || 5;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/condominios${queryString ? `?${queryString}` : ""}`;

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<PaginatedResponse<Condominio>>({
    queryKey: ["condominios", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  const condominios = response?.data || [];
  const total = response?.total || 0;
  const currentPage = response?.page || 1;
  const totalPages = response?.totalPages || 0;
  const limitValue = response?.limit || limit;

  const handleStatusFilter = (status: boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      isActive: status === null ? undefined : status,
      page: 1, // Resetear a la primera página cuando cambia el filtro
    }));
  };

  const handlePlanFilter = (plan: string | null) => {
    setFilters((prev) => ({
      ...prev,
      subscriptionPlan: plan || undefined,
      page: 1, // Resetear a la primera página cuando cambia el filtro
    }));
  };

  const handleCityFilter = (city: string | null) => {
    setFilters((prev) => ({
      ...prev,
      city: city || undefined,
      page: 1, // Resetear a la primera página cuando cambia el filtro
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 5 });
    setSearchName("");
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Contar todos los filtros activos que se envían al backend
  const activeFiltersCount = [
    filters.search,
    filters.isActive !== undefined ? filters.isActive : undefined,
    filters.subscriptionPlan,
    filters.city,
  ].filter((v) => v !== undefined).length;

  const handleView = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setViewModalOpen(true);
  };

  const handleEdit = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setEditModalOpen(true);
  };

  // Mutación para eliminar condominio
  const deleteMutation = useMutation({
    mutationFn: async (condominioId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/condominios/${condominioId}/delete`);
    },
    onSuccess: () => {
      toast.success("Condominio eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el condominio";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleDelete = (condominio: Condominio) => {
    deleteMutation.mutate(condominio.id);
  };

  const handleSave = async (formData: FormData) => {
    if (!selectedCondominio) return;

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const baseURL = axiosInstance.defaults.baseURL || "/api";

      // Crear una instancia temporal de axios sin Content-Type por defecto para FormData
      const formDataAxiosInstance = axios.create({
        baseURL,
        withCredentials: true,
        // No establecer Content-Type aquí, axios lo establecerá automáticamente para FormData
      });

      await formDataAxiosInstance.put(
        `/condominios/${selectedCondominio.id}`,
        formData
      );

      // Invalidar y revalidar las queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ["condominios"] });

      setEditModalOpen(false);
      setSelectedCondominio(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      // TODO: Show error message
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-3xl font-bold">Condominios</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y administra todos los condominios de la plataforma
          </p>
        </div>

      
      </div>

      <CondominiosFiltersComponent
        filters={filters}
        searchName={searchName}
        onSearchNameChange={setSearchName}
        onStatusFilter={handleStatusFilter}
        onPlanFilter={handlePlanFilter}
        onCityFilter={handleCityFilter}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <CondominiosTable
        condominios={condominios}
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

      <ViewCondominioDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        condominio={selectedCondominio}
      />

      <EditCondominioDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        condominio={selectedCondominio}
        onSave={handleSave}
      />

     
    </div>
  );
}

export default SuperAdminCondominiosPage;
