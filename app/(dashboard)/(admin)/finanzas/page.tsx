"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type { Factura, FacturaEstado, Unidad } from "@/types/types";
import { FacturasTable } from "@/components/dashboard/admin/finanzas/facturas-table";
import { FacturasFiltersComponent, type FacturasFilters } from "@/components/dashboard/admin/finanzas/facturas-filters";
import { CreateFacturaDialog } from "@/components/dashboard/admin/finanzas/create-factura-dialog";
import { CreateFacturasBulkDialog } from "@/components/dashboard/admin/finanzas/create-facturas-bulk-dialog";
import { ViewFacturaDialog } from "@/components/dashboard/admin/finanzas/view-factura-dialog";
import { CreatePagoDialog } from "@/components/dashboard/admin/finanzas/create-pago-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled, IconFileUpload } from "@tabler/icons-react";

function FinanzasPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createBulkDialogOpen, setCreateBulkDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [filters, setFilters] = useState<FacturasFilters>({
    page: 1,
    limit: 10,
  });

  // Función para convertir fecha de date a ISO string con timezone offset
  const convertirFechaFiltro = (fechaLocal: string): string => {
    if (!fechaLocal) return "";
    // Si ya tiene formato ISO completo, devolverlo
    if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
      return fechaLocal;
    }
    // date viene como "YYYY-MM-DD" en hora local
    // Agregar hora de fin de día con timezone offset
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '-' : '+';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    return fechaLocal + `T23:59:59${offsetString}`;
  };

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters.unidadId) queryParams.append("unidadId", filters.unidadId);
  if (filters.userId) queryParams.append("userId", filters.userId);
  if (filters.periodo) queryParams.append("periodo", filters.periodo);
  if (filters.estado) queryParams.append("estado", filters.estado);
  if (filters.fechaVencimientoDesde) queryParams.append("fechaVencimientoDesde", convertirFechaFiltro(filters.fechaVencimientoDesde));
  if (filters.fechaVencimientoHasta) queryParams.append("fechaVencimientoHasta", convertirFechaFiltro(filters.fechaVencimientoHasta));
  
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/finanzas/facturas${queryString ? `?${queryString}` : ""}`;

  // Obtener facturas
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<Factura[] | {
    data: Factura[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["facturas", filters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  // Obtener unidades para filtros
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  // Manejar diferentes formatos de respuesta
  let facturas: Factura[] = [];
  let total = 0;
  let currentPage = page;
  let totalPages = 0;
  let limitValue = limit;

  if (response) {
    if (Array.isArray(response)) {
      facturas = response;
      total = response.length;
      totalPages = 1;
    } else if (response.data && Array.isArray(response.data)) {
      facturas = response.data;
      total = response.total ?? response.data.length;
      currentPage = response.page ?? page;
      totalPages = response.totalPages ?? Math.ceil(total / limit);
      limitValue = response.limit ?? limit;
    }
  }

  // Mutación para enviar factura
  const enviarMutation = useMutation({
    mutationFn: async (facturaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/finanzas/facturas/${facturaId}/enviar`);
    },
    onSuccess: () => {
      toast.success("Factura enviada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al enviar la factura";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para eliminar factura
  const eliminarMutation = useMutation({
    mutationFn: async (facturaId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/finanzas/facturas/${facturaId}`);
    },
    onSuccess: () => {
      toast.success("Factura eliminada exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar la factura";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const handleView = (factura: Factura) => {
    setSelectedFactura(factura);
    setViewDialogOpen(true);
  };

  const handleEnviar = (factura: Factura) => {
    enviarMutation.mutate(factura.id);
  };

  const handlePagar = (factura: Factura) => {
    setSelectedFactura(factura);
    setPagoDialogOpen(true);
  };

  const handleDelete = (factura: Factura) => {
    eliminarMutation.mutate(factura.id);
  };

  const handleUnidadFilter = (unidadId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      unidadId: unidadId || undefined,
      page: 1,
    }));
  };

  const handlePeriodoFilter = (periodo: string) => {
    setFilters((prev) => ({
      ...prev,
      periodo: periodo || undefined,
      page: 1,
    }));
  };

  const handleEstadoFilter = (estado: FacturaEstado | null) => {
    setFilters((prev) => ({
      ...prev,
      estado: estado || undefined,
      page: 1,
    }));
  };

  const handleFechaVencimientoDesdeChange = (fecha: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaVencimientoDesde: fecha || undefined,
      page: 1,
    }));
  };

  const handleFechaVencimientoHastaChange = (fecha: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaVencimientoHasta: fecha || undefined,
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
    filters.unidadId,
    filters.userId,
    filters.periodo,
    filters.estado,
    filters.fechaVencimientoDesde,
    filters.fechaVencimientoHasta,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona facturas y pagos del condominio
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setCreateBulkDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <IconFileUpload className="size-4" />
            Crear Masivas
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
          >
            <IconCirclePlusFilled className="size-4" />
            Crear Factura
          </Button>
        </div>
      </div>

      <FacturasFiltersComponent
        filters={filters}
        unidades={unidades.map(u => ({ id: u.id, identificador: u.identificador }))}
        onUnidadFilter={handleUnidadFilter}
        onPeriodoFilter={handlePeriodoFilter}
        onEstadoFilter={handleEstadoFilter}
        onFechaVencimientoDesdeChange={handleFechaVencimientoDesdeChange}
        onFechaVencimientoHastaChange={handleFechaVencimientoHastaChange}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <FacturasTable
        facturas={facturas}
        isLoading={isLoading}
        error={error}
        onView={handleView}
        onEnviar={handleEnviar}
        onPagar={handlePagar}
        onDelete={handleDelete}
        isAdmin={true}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limitValue}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <CreateFacturaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <CreateFacturasBulkDialog
        open={createBulkDialogOpen}
        onOpenChange={setCreateBulkDialogOpen}
      />

      <ViewFacturaDialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setSelectedFactura(null);
          }
        }}
        factura={selectedFactura}
      />

      <CreatePagoDialog
        open={pagoDialogOpen}
        onOpenChange={(open) => {
          setPagoDialogOpen(open);
          if (!open) {
            setSelectedFactura(null);
          }
        }}
        factura={selectedFactura}
        isAdmin={true}
      />
    </div>
  );
}

export default FinanzasPage;
