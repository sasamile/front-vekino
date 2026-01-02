"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type { Reserva, ReservaEstado, EspacioComun } from "@/types/types";
import { ReservasTable } from "@/components/dashboard/admin/reservas/reservas-table";
import { ReservasFiltersComponent, type ReservasFilters } from "@/components/dashboard/admin/reservas/reservas-filters";
import { CreateReservaDialog } from "@/components/dashboard/admin/reservas/create-reserva-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";

function ReservasPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ReservasFilters>({
    page: 1,
    limit: 10,
  });

  // Función para convertir fecha de datetime-local a ISO string con timezone offset
  // datetime-local devuelve "YYYY-MM-DDTHH:mm" en hora local del usuario
  // Según la documentación, usar formato con timezone offset explícito
  const convertirFechaFiltro = (fechaLocal: string): string => {
    if (!fechaLocal) return "";
    // Si ya tiene formato ISO completo, devolverlo
    if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
      return fechaLocal;
    }
    // datetime-local viene como "YYYY-MM-DDTHH:mm" en hora local
    // Obtener el offset de timezone del sistema (ej: -05:00 para Colombia)
    // getTimezoneOffset() devuelve minutos: positivo = detrás de UTC, negativo = adelante de UTC
    // Para Colombia UTC-5: getTimezoneOffset() = 300 (positivo = detrás), queremos "-05:00"
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '-' : '+'; // Si está detrás de UTC, el signo es negativo
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    // Agregar segundos y el offset de timezone
    if (fechaLocal.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return fechaLocal + `:00${offsetString}`;
    }
    return fechaLocal;
  };

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.estado) queryParams.append("estado", filters.estado);
  if (filters.espacioComunId) queryParams.append("espacioComunId", filters.espacioComunId);
  if (filters.fechaDesde) queryParams.append("fechaDesde", convertirFechaFiltro(filters.fechaDesde));
  if (filters.fechaHasta) queryParams.append("fechaHasta", convertirFechaFiltro(filters.fechaHasta));
  
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/reservas${queryString ? `?${queryString}` : ""}`;

  // Obtener reservas
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<Reserva[] | {
    data: Reserva[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["reservas", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  // Obtener espacios comunes para filtros
  const { data: espacios = [] } = useQuery<EspacioComun[]>({
    queryKey: ["espacios-comunes"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/reservas/espacios");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  // Manejar diferentes formatos de respuesta
  let reservas: Reserva[] = [];
  let total = 0;
  let currentPage = page;
  let totalPages = 0;
  let limitValue = limit;

  if (response) {
    if (Array.isArray(response)) {
      reservas = response;
      total = response.length;
      totalPages = 1;
    } else if (response.data && Array.isArray(response.data)) {
      reservas = response.data;
      total = response.total ?? response.data.length;
      currentPage = response.page ?? page;
      totalPages = response.totalPages ?? Math.ceil(total / limit);
      limitValue = response.limit ?? limit;
    }
  }

  // Mutación para aprobar reserva
  const aprobarMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/reservas/${reservaId}/aprobar`);
    },
    onSuccess: () => {
      toast.success("Reserva aprobada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al aprobar la reserva";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para rechazar reserva
  const rechazarMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/reservas/${reservaId}/rechazar`);
    },
    onSuccess: () => {
      toast.success("Reserva rechazada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al rechazar la reserva";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para cancelar reserva
  const cancelarMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/reservas/${reservaId}/cancelar`);
    },
    onSuccess: () => {
      toast.success("Reserva cancelada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al cancelar la reserva";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para eliminar reserva
  const deleteMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/reservas/${reservaId}`);
    },
    onSuccess: () => {
      toast.success("Reserva eliminada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar la reserva";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleAprobar = (reserva: Reserva) => {
    if (window.confirm(`¿Estás seguro de que deseas aprobar la reserva?`)) {
      aprobarMutation.mutate(reserva.id);
    }
  };

  const handleRechazar = (reserva: Reserva) => {
    if (window.confirm(`¿Estás seguro de que deseas rechazar la reserva?`)) {
      rechazarMutation.mutate(reserva.id);
    }
  };

  const handleCancelar = (reserva: Reserva) => {
    if (window.confirm(`¿Estás seguro de que deseas cancelar la reserva?`)) {
      cancelarMutation.mutate(reserva.id);
    }
  };

  const handleDelete = (reserva: Reserva) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar la reserva?`
      )
    ) {
      deleteMutation.mutate(reserva.id);
    }
  };

  const handleEstadoFilter = (estado: ReservaEstado | null) => {
    setFilters((prev) => ({
      ...prev,
      estado: estado || undefined,
      page: 1,
    }));
  };

  const handleEspacioFilter = (espacioId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      espacioComunId: espacioId || undefined,
      page: 1,
    }));
  };

  const handleFechaDesdeChange = (fecha: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaDesde: fecha || undefined,
      page: 1,
    }));
  };

  const handleFechaHastaChange = (fecha: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaHasta: fecha || undefined,
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
    filters.estado,
    filters.espacioComunId,
    filters.fechaDesde,
    filters.fechaHasta,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona todas las reservas de espacios comunes
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2"
        >
          <IconCirclePlusFilled className="size-4" />
          Crear Reserva
        </Button>
      </div>

      <ReservasFiltersComponent
        filters={filters}
        espacios={espacios}
        onEstadoFilter={handleEstadoFilter}
        onEspacioFilter={handleEspacioFilter}
        onFechaDesdeChange={handleFechaDesdeChange}
        onFechaHastaChange={handleFechaHastaChange}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <ReservasTable
        reservas={reservas}
        isLoading={isLoading}
        error={error}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        onCancelar={handleCancelar}
        onDelete={handleDelete}
        isAdmin={true}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limitValue}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <CreateReservaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default ReservasPage;
