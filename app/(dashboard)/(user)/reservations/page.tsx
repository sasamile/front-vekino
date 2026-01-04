"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconPlus,
  IconUsers,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import type { Reserva, ReservaEstado, EspacioComun, CreateReservaRequest } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const reservaSchema = z.object({
  espacioComunId: z.string().min(1, "El espacio es requerido"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  motivo: z.string().optional(),
  cantidadPersonas: z.number().optional(),
});

type ReservaFormData = z.infer<typeof reservaSchema>;

function ReservationsPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFecha, setSelectedFecha] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
  });

  const espacioSeleccionado = watch("espacioComunId");

  // Obtener reservas de la semana
  const { data: reservasSemana = [], isLoading: semanaLoading } = useQuery<Reserva[]>({
    queryKey: ["usuario-reservas-semana", selectedFecha],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const fechaInicio = selectedFecha.toISOString();
      const response = await axiosInstance.get(
        `/usuario/reservas/semana?fechaInicio=${fechaInicio}`
      );
      return response.data;
    },
  });

  // Obtener mis reservas
  const {
    data: misReservasResponse,
    isLoading: misReservasLoading,
  } = useQuery<{
    data: Reserva[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["usuario-mis-reservas", page, limit],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(
        `/usuario/reservas?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

  // Obtener espacios disponibles
  const {
    data: espaciosDisponibles = [],
    isLoading: espaciosLoading,
  } = useQuery<EspacioComun[]>({
    queryKey: ["usuario-espacios-disponibles"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/usuario/reservas/espacios-disponibles");
      return response.data;
    },
  });

  // Obtener horas disponibles del espacio seleccionado
  const fechaSeleccionada = watch("fechaInicio");
  const {
    data: horasDisponibles,
    isLoading: horasLoading,
  } = useQuery<{
    espacio: EspacioComun;
    horasOcupadas: Array<{ inicio: string; fin: string; estado: string }>;
  }>({
    queryKey: ["horas-disponibles", espacioSeleccionado, fechaSeleccionada],
    queryFn: async () => {
      if (!espacioSeleccionado || !fechaSeleccionada) return null;
      const axiosInstance = getAxiosInstance(subdomain);
      const fecha = new Date(fechaSeleccionada).toISOString();
      const response = await axiosInstance.get(
        `/usuario/reservas/espacios/${espacioSeleccionado}/horas-disponibles?fecha=${fecha}`
      );
      return response.data;
    },
    enabled: !!espacioSeleccionado && !!fechaSeleccionada,
  });

  // Mutación para crear reserva
  const crearReservaMutation = useMutation({
    mutationFn: async (data: CreateReservaRequest) => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.post("/usuario/reservas", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Reserva creada exitosamente", { duration: 2000 });
      reset();
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["usuario-reservas"] });
      queryClient.invalidateQueries({ queryKey: ["usuario-reservas-semana"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear la reserva";
      toast.error(errorMessage, { duration: 3000 });
    },
  });

  const onSubmit = async (data: ReservaFormData) => {
    await crearReservaMutation.mutateAsync({
      espacioComunId: data.espacioComunId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      motivo: data.motivo,
      cantidadPersonas: data.cantidadPersonas,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Gratis";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEstadoBadge = (estado: ReservaEstado) => {
    const variants: Record<
      ReservaEstado,
      { variant: "default" | "destructive" | "secondary"; label: string; icon: any }
    > = {
      CONFIRMADA: {
        variant: "default",
        label: "Confirmada",
        icon: IconCheck,
      },
      PENDIENTE: {
        variant: "secondary",
        label: "Pendiente",
        icon: IconClock,
      },
      CANCELADA: {
        variant: "destructive",
        label: "Cancelada",
        icon: IconX,
      },
      COMPLETADA: {
        variant: "default",
        label: "Completada",
        icon: IconCheck,
      },
    };
    const config = variants[estado] || {
      variant: "secondary" as const,
      label: estado,
      icon: IconAlertCircle,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  const getTipoEspacioLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      SALON_SOCIAL: "Salón Social",
      ZONA_BBQ: "Zona BBQ",
      SAUNA: "Sauna",
      CASA_EVENTOS: "Casa de Eventos",
      GIMNASIO: "Gimnasio",
      PISCINA: "Piscina",
      CANCHA_DEPORTIVA: "Cancha Deportiva",
      PARQUEADERO: "Parqueadero",
      OTRO: "Otro",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Reservas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus reservas de espacios comunes
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="size-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Reserva</DialogTitle>
              <DialogDescription>
                Selecciona un espacio común y el horario deseado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Espacio Común</FieldLabel>
                  <select
                    {...register("espacioComunId")}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona un espacio</option>
                    {espaciosDisponibles.map((espacio) => (
                      <option key={espacio.id} value={espacio.id}>
                        {espacio.nombre} - {getTipoEspacioLabel(espacio.tipo)}
                      </option>
                    ))}
                  </select>
                  {errors.espacioComunId && (
                    <FieldError>{errors.espacioComunId.message}</FieldError>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Fecha y Hora de Inicio</FieldLabel>
                    <Input
                      type="datetime-local"
                      {...register("fechaInicio")}
                    />
                    {errors.fechaInicio && (
                      <FieldError>{errors.fechaInicio.message}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>Fecha y Hora de Fin</FieldLabel>
                    <Input
                      type="datetime-local"
                      {...register("fechaFin")}
                    />
                    {errors.fechaFin && (
                      <FieldError>{errors.fechaFin.message}</FieldError>
                    )}
                  </Field>
                </div>

                {horasDisponibles && horasDisponibles.horasOcupadas.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-2">
                      Horas ocupadas:
                    </div>
                    <div className="space-y-1">
                      {horasDisponibles.horasOcupadas.map((hora, idx) => (
                        <div key={idx} className="text-xs text-yellow-700">
                          {formatDate(hora.inicio)} - {formatDate(hora.fin)} ({hora.estado})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Field>
                  <FieldLabel>Motivo (opcional)</FieldLabel>
                  <Input {...register("motivo")} placeholder="Ej: Celebración de cumpleaños" />
                </Field>

                <Field>
                  <FieldLabel>Cantidad de Personas (opcional)</FieldLabel>
                  <Input
                    type="number"
                    {...register("cantidadPersonas", { valueAsNumber: true })}
                    placeholder="Ej: 20"
                  />
                </Field>
              </FieldGroup>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setCreateDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearReservaMutation.isPending}>
                  {crearReservaMutation.isPending ? "Creando..." : "Crear Reserva"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reservas de la Semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="size-5" />
            Reservas de la Semana
          </CardTitle>
          <CardDescription>
            Reservas confirmadas para esta semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          {semanaLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : reservasSemana.length > 0 ? (
            <div className="space-y-4">
              {reservasSemana.map((reserva) => (
                <div
                  key={reserva.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconMapPin className="size-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {reserva.espacioComun?.nombre || "Espacio"}
                        </span>
                        {getEstadoBadge(reserva.estado)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Inicio: {formatDate(reserva.fechaInicio)}</div>
                        <div>Fin: {formatDate(reserva.fechaFin)}</div>
                        {reserva.motivo && (
                          <div className="mt-1">Motivo: {reserva.motivo}</div>
                        )}
                        {reserva.cantidadPersonas && (
                          <div className="flex items-center gap-1 mt-1">
                            <IconUsers className="size-3" />
                            {reserva.cantidadPersonas} personas
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(reserva.precioTotal)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay reservas para esta semana
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mis Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Reservas</CardTitle>
          <CardDescription>
            {misReservasResponse
              ? `Total: ${misReservasResponse.total} reservas`
              : "Cargando reservas..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {misReservasLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : misReservasResponse && misReservasResponse.data.length > 0 ? (
            <div className="space-y-4">
              {misReservasResponse.data.map((reserva) => (
                <div
                  key={reserva.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {reserva.espacioComun?.nombre || "Espacio"}
                        </span>
                        {getEstadoBadge(reserva.estado)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Inicio: {formatDate(reserva.fechaInicio)}</div>
                        <div>Fin: {formatDate(reserva.fechaFin)}</div>
                        {reserva.motivo && (
                          <div className="mt-1">Motivo: {reserva.motivo}</div>
                        )}
                        <div className="mt-1">
                          Creada: {formatDate(reserva.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(reserva.precioTotal)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {misReservasResponse.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {misReservasResponse.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(misReservasResponse.totalPages, p + 1))
                    }
                    disabled={page === misReservasResponse.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tienes reservas aún
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReservationsPage;
