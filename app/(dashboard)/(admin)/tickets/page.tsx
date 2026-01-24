"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type {
  Ticket,
  Unidad,
  TicketEstado,
} from "@/types/types";
import type { TicketsFilters } from "@/components/dashboard/admin/comunidad/tickets-filters";
import { TicketsTable } from "@/components/dashboard/admin/comunidad/tickets-table";
import { TicketsFiltersComponent } from "@/components/dashboard/admin/comunidad/tickets-filters";
import { CreateTicketDialog } from "@/components/dashboard/admin/comunidad/create-ticket-dialog";
import { ViewTicketDialog } from "@/components/dashboard/admin/comunidad/view-ticket-dialog";
import { EditTicketDialog } from "@/components/dashboard/admin/comunidad/edit-ticket-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";

function TicketsPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  const [editTicketDialogOpen, setEditTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filtros para tickets
  const [ticketFilters, setTicketFilters] = useState<TicketsFilters>({
    page: 1,
    limit: 10,
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

  // Obtener usuario actual para verificar permisos
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
  });

  const isAdmin = currentUser ? currentUser.role === "ADMIN" : true;

  // Construir query params para tickets
  const ticketQueryParams = new URLSearchParams();
  if (ticketFilters.estado) ticketQueryParams.append("estado", ticketFilters.estado);
  if (ticketFilters.categoria) ticketQueryParams.append("categoria", ticketFilters.categoria);
  if (ticketFilters.unidadId) ticketQueryParams.append("unidadId", ticketFilters.unidadId);
  if (ticketFilters.userId) ticketQueryParams.append("userId", ticketFilters.userId);
  ticketQueryParams.append("page", String(ticketFilters.page));
  ticketQueryParams.append("limit", String(ticketFilters.limit));

  const ticketQueryString = ticketQueryParams.toString();
  const ticketEndpoint = `/comunicacion/tickets${ticketQueryString ? `?${ticketQueryString}` : ""}`;

  // Obtener tickets
  const {
    data: ticketsResponse,
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useQuery<
    Ticket[] | {
      data: Ticket[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  >({
    queryKey: ["tickets", ticketFilters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(ticketEndpoint);
      return response.data;
    },
  });

  // Manejar diferentes formatos de respuesta para tickets
  let tickets: Ticket[] = [];
  let ticketsTotal = 0;
  let ticketsCurrentPage = ticketFilters.page;
  let ticketsTotalPages = 0;
  let ticketsLimit = ticketFilters.limit;

  if (ticketsResponse) {
    if (Array.isArray(ticketsResponse)) {
      tickets = ticketsResponse;
      ticketsTotal = ticketsResponse.length;
      ticketsTotalPages = 1;
    } else if (ticketsResponse.data && Array.isArray(ticketsResponse.data)) {
      tickets = ticketsResponse.data;
      ticketsTotal = ticketsResponse.total ?? ticketsResponse.data.length;
      ticketsCurrentPage = ticketsResponse.page ?? ticketFilters.page;
      ticketsTotalPages = ticketsResponse.totalPages ?? Math.ceil(ticketsTotal / ticketsLimit);
      ticketsLimit = ticketsResponse.limit ?? ticketFilters.limit;
    }
  }

  // Mutación para eliminar ticket
  const eliminarTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/tickets/${ticketId}`);
    },
    onSuccess: () => {
      toast.success("Ticket eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el ticket";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para cambiar estado del ticket
  const cambiarEstadoTicketMutation = useMutation({
    mutationFn: async ({ ticketId, nuevoEstado }: { ticketId: string; nuevoEstado: TicketEstado }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.put(`/comunicacion/tickets/${ticketId}`, {
        estado: nuevoEstado,
      });
    },
    onSuccess: (_, variables) => {
      const estadoLabels: Record<TicketEstado, string> = {
        ABIERTO: "Abierto",
        EN_PROGRESO: "En Progreso",
        RESUELTO: "Resuelto",
        CERRADO: "Cerrado",
      };
      toast.success(`Ticket cambiado a "${estadoLabels[variables.nuevoEstado]}"`, {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al cambiar el estado del ticket";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Handlers para tickets
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setViewTicketDialogOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditTicketDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    eliminarTicketMutation.mutate(ticket.id);
  };

  const handleEstadoChange = (ticket: Ticket, nuevoEstado: TicketEstado) => {
    cambiarEstadoTicketMutation.mutate({
      ticketId: ticket.id,
      nuevoEstado,
    });
  };

  const handleTicketEstadoFilter = (estado: any) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      estado: estado || undefined,
      page: 1,
    }));
  };

  const handleTicketCategoriaFilter = (categoria: string | null) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      categoria: categoria || undefined,
      page: 1,
    }));
  };

  const handleTicketUnidadFilter = (unidadId: string | null) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      unidadId: unidadId || undefined,
      page: 1,
    }));
  };

  const clearTicketFilters = () => {
    setTicketFilters({ page: 1, limit: 10 });
  };

  const handleTicketPageChange = (newPage: number) => {
    setTicketFilters((prev: TicketsFilters) => ({ ...prev, page: newPage }));
  };

  const handleTicketLimitChange = (newLimit: number) => {
    setTicketFilters((prev: TicketsFilters) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const activeTicketFiltersCount = [
    ticketFilters.estado,
    ticketFilters.categoria,
    ticketFilters.unidadId,
    ticketFilters.userId,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-y-2">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los tickets de administración del condominio
          </p>
        </div>
        <Button
          onClick={() => setCreateTicketDialogOpen(true)}
          className="gap-2 w-full sm:w-auto"
        >
          <IconCirclePlusFilled className="size-4" />
          Crear Ticket
        </Button>
      </div>

      <TicketsFiltersComponent
        filters={ticketFilters}
        unidades={unidades.map((u) => ({
          id: u.id,
          identificador: u.identificador,
        }))}
        onEstadoFilter={handleTicketEstadoFilter}
        onCategoriaFilter={handleTicketCategoriaFilter}
        onUnidadFilter={handleTicketUnidadFilter}
        onClearFilters={clearTicketFilters}
        activeFiltersCount={activeTicketFiltersCount}
      />

      <TicketsTable
        tickets={tickets}
        isLoading={ticketsLoading}
        error={ticketsError}
        onView={handleViewTicket}
        onEdit={handleEditTicket}
        onDelete={handleDeleteTicket}
        onEstadoChange={handleEstadoChange}
        isAdmin={isAdmin}
        total={ticketsTotal}
        currentPage={ticketsCurrentPage}
        totalPages={ticketsTotalPages}
        limit={ticketsLimit}
        onPageChange={handleTicketPageChange}
        onLimitChange={handleTicketLimitChange}
      />

      <CreateTicketDialog
        open={createTicketDialogOpen}
        onOpenChange={setCreateTicketDialogOpen}
      />

      <ViewTicketDialog
        open={viewTicketDialogOpen}
        onOpenChange={(open) => {
          setViewTicketDialogOpen(open);
          if (!open) {
            setSelectedTicket(null);
          }
        }}
        ticket={selectedTicket}
        isAdmin={isAdmin}
      />

      <EditTicketDialog
        open={editTicketDialogOpen}
        onOpenChange={(open) => {
          setEditTicketDialogOpen(open);
          if (!open) {
            setSelectedTicket(null);
          }
        }}
        ticket={selectedTicket}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default TicketsPage;
