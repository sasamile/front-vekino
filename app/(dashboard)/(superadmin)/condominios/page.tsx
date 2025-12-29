"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { useDebounce } from "@/hooks/use-debounce";
import type { Condominio } from "@/types/types";
import type { CondominiosFilters } from "@/types/condominios";
import { CondominiosFiltersComponent } from "@/components/dashboard/superadmin/condominios/condominios-filters";
import { CondominiosTable } from "@/components/dashboard/superadmin/condominios/condominios-table";
import { ViewCondominioDialog } from "@/components/dashboard/superadmin/condominios/view-condominio-dialog";
import { EditCondominioDialog } from "@/components/dashboard/superadmin/condominios/edit-condominio-dialog";

function SuperAdminCondominiosPage() {
  const { subdomain } = useSubdomain();
  const [filters, setFilters] = useState<CondominiosFilters>({});
  const [searchName, setSearchName] = useState("");
  const debouncedSearchName = useDebounce(searchName, 300);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);

  // Actualizar filtros cuando cambia el debounce
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      name: debouncedSearchName || undefined,
    }));
  }, [debouncedSearchName]);

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.name) queryParams.append("name", filters.name);
  if (filters.isActive !== undefined) queryParams.append("isActive", String(filters.isActive));
  if (filters.subscriptionPlan) queryParams.append("subscriptionPlan", filters.subscriptionPlan);
  if (filters.city) queryParams.append("city", filters.city);

  const queryString = queryParams.toString();
  const endpoint = `/condominios${queryString ? `?${queryString}` : ""}`;

  const { data: condominios = [], isLoading, error } = useQuery<Condominio[]>({
    queryKey: ["condominios", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  const handleStatusFilter = (status: boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      isActive: status === null ? undefined : status,
    }));
  };

  const handlePlanFilter = (plan: string | null) => {
    setFilters((prev) => ({
      ...prev,
      subscriptionPlan: plan || undefined,
    }));
  };

  const handleCityFilter = (city: string | null) => {
    setFilters((prev) => ({
      ...prev,
      city: city || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchName("");
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined).length;

  const handleView = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setViewModalOpen(true);
  };

  const handleEdit = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setEditModalOpen(true);
  };

  const handleSave = async (data: Partial<Condominio>) => {
    if (!selectedCondominio) return;
    
    try {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.put(`/condominios/${selectedCondominio.id}`, data);
      // TODO: Refetch data or show success message
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      // TODO: Show error message
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Condominios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y administra todos los condominios de la plataforma
        </p>
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
