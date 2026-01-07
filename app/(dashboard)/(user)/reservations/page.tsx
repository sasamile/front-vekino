"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import type { Reserva, ReservaEstado, EspacioComun, CreateReservaRequest, HorarioDisponibilidad, DisponibilidadCompletaResponse } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormularioReserva } from "@/components/dashboard/user/reservations/formulario-reserva";
import { CalendarioSemanal } from "@/components/dashboard/user/reservations/calendario-semanal";
import { HistorialReservas } from "@/components/dashboard/user/reservations/historial-reservas";
import { BadgeEstado } from "@/components/dashboard/user/reservations/badge-estado";
import {
  esDiaDisponible,
  esHoraDisponible,
  esRangoHorasDisponible,
  esDiaDisponibleCalendario,
  tieneHorasDisponibles,
} from "@/components/dashboard/user/reservations/validaciones";
import { obtenerTodasLasHoras } from "@/components/dashboard/user/reservations/obtener-horas";
import { parsearFechaLocal } from "@/components/dashboard/user/reservations/utils";

const reservaSchema = z.object({
  espacioComunId: z.string().min(1, "El espacio común es requerido"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  motivo: z.string().optional(),
  cantidadPersonas: z.number().optional(),
}).refine((data) => new Date(data.fechaFin) > new Date(data.fechaInicio), {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fechaFin"],
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
    setValue,
    setError,
    clearErrors,
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      espacioComunId: "",
      fechaInicio: "",
      fechaFin: "",
      motivo: "",
      cantidadPersonas: undefined,
    },
  });

  const espacioComunId = watch("espacioComunId");
  const fechaInicio = watch("fechaInicio");
  const fechaFin = watch("fechaFin");

  // Estado para el calendario visual
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");
  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState<string>("");
  const [horaFinSeleccionada, setHoraFinSeleccionada] = useState<string>("");
  const [mesActual, setMesActual] = useState(new Date());

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
  const { data: espaciosDisponibles = [] } = useQuery<EspacioComun[]>({
    queryKey: ["usuario-espacios-disponibles"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/usuario/reservas/espacios-disponibles");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: createDialogOpen,
  });

  // Obtener el espacio común seleccionado
  const espacioSeleccionado = espaciosDisponibles.find((e) => e.id === espacioComunId);

  // Obtener disponibilidad completa cuando se selecciona un espacio
  const { data: disponibilidad } = useQuery<DisponibilidadCompletaResponse>({
    queryKey: ["disponibilidad-completa-usuario", espacioComunId],
    queryFn: async () => {
      if (!espacioComunId) return null;
      const axiosInstance = getAxiosInstance(subdomain);
      try {
        const response = await axiosInstance.get(`/usuario/reservas/espacios/${espacioComunId}/disponibilidad-completa`);
        return response.data;
      } catch {
        const response = await axiosInstance.get(`/reservas/espacios/${espacioComunId}/disponibilidad-completa`);
        return response.data;
      }
    },
    enabled: !!espacioComunId && createDialogOpen,
  });

  // Usar horarios de disponibilidad del endpoint o del espacio común como fallback
  const horariosDisponibilidad = useMemo(() => {
    if (disponibilidad?.horariosDisponibilidad) {
      return disponibilidad.horariosDisponibilidad;
    }
    if (!espacioSeleccionado?.horariosDisponibilidad) return null;
    try {
      return JSON.parse(espacioSeleccionado.horariosDisponibilidad) as HorarioDisponibilidad[];
    } catch {
      return null;
    }
  }, [disponibilidad, espacioSeleccionado]);

  // Obtener el rango de horas mínimo y máximo de todos los días
  const getGlobalMinMaxTime = () => {
    if (!horariosDisponibilidad || horariosDisponibilidad.length === 0) {
      return { minHora: "", maxHora: "" };
    }
    const horasInicio = horariosDisponibilidad.map((h) => h.horaInicio).sort();
    const horasFin = horariosDisponibilidad.map((h) => h.horaFin).sort();
    return {
      minHora: horasInicio[0],
      maxHora: horasFin[horasFin.length - 1],
    };
  };

  const { minHora, maxHora } = getGlobalMinMaxTime();

  // Funciones wrapper para las validaciones
  const esDiaDisponibleWrapper = (fecha: string) => esDiaDisponible(fecha, disponibilidad || null);
  const esHoraDisponibleWrapper = (fechaHora: string) => esHoraDisponible(fechaHora, disponibilidad || null, horariosDisponibilidad);
  const esRangoHorasDisponibleWrapper = (fechaInicio: string, fechaFin: string) => esRangoHorasDisponible(fechaInicio, fechaFin, disponibilidad || null);
  const esDiaDisponibleCalendarioWrapper = (diaSemana: number, fechaStr: string) => esDiaDisponibleCalendario(diaSemana, fechaStr, disponibilidad || null);
  const tieneHorasDisponiblesWrapper = (fechaStr: string) => {
    const horas = obtenerTodasLasHoras(fechaStr, disponibilidad || null, horariosDisponibilidad);
    return horas.some(h => !h.ocupada && !h.pasada);
  };

  // Validar fecha cuando cambia (solo si NO estamos usando el calendario visual)
  useEffect(() => {
    if (fechaInicio && espacioComunId && !fechaSeleccionada) {
      if (!esDiaDisponibleWrapper(fechaInicio)) {
        setError("fechaInicio", {
          type: "manual",
          message: "Este día no está disponible para reservas en este espacio",
        });
        return;
      }
      if (!esHoraDisponibleWrapper(fechaInicio)) {
        setError("fechaInicio", {
          type: "manual",
          message: "Esta hora no está disponible. Verifica los horarios y reservas existentes",
        });
        return;
      }
      clearErrors("fechaInicio");
    } else if (fechaSeleccionada && horaInicioSeleccionada) {
      clearErrors("fechaInicio");
    }
  }, [fechaInicio, espacioComunId, disponibilidad, fechaSeleccionada, horaInicioSeleccionada, setError, clearErrors]);

  // Validar fecha fin cuando cambia
  useEffect(() => {
    if (fechaFin && fechaInicio && espacioComunId && !fechaSeleccionada) {
      if (!esDiaDisponibleWrapper(fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "Este día no está disponible para reservas en este espacio",
        });
        return;
      }
      if (!esHoraDisponibleWrapper(fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "Esta hora no está disponible. Verifica los horarios y reservas existentes",
        });
        return;
      }
      if (!esRangoHorasDisponibleWrapper(fechaInicio, fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "El rango de horas seleccionado no está disponible. Hay reservas que se solapan",
        });
        return;
      }
      clearErrors("fechaFin");
    } else if (fechaSeleccionada && horaFinSeleccionada) {
      clearErrors("fechaFin");
    }
  }, [fechaFin, fechaInicio, espacioComunId, disponibilidad, fechaSeleccionada, horaFinSeleccionada, setError, clearErrors]);

  // Manejar selección de fecha
  const handleFechaSeleccionada = (fechaStr: string, diaSemana: number) => {
    if (!esDiaDisponibleCalendarioWrapper(diaSemana, fechaStr)) {
      toast.error("Este día no está disponible para reservas", { duration: 2000 });
      return;
    }
    setFechaSeleccionada(fechaStr);
    setHoraInicioSeleccionada("");
    setHoraFinSeleccionada("");
    clearErrors("fechaInicio");
    clearErrors("fechaFin");
    const fechaCompleta = `${fechaStr}T00:00`;
    setValue("fechaInicio", fechaCompleta);
    setValue("fechaFin", fechaCompleta);
  };

  // Manejar selección de hora inicio
  const handleHoraInicioSeleccionada = (hora: string) => {
    if (!fechaSeleccionada) {
      toast.error("Primero selecciona una fecha", { duration: 2000 });
      return;
    }
    setHoraInicioSeleccionada(hora);
    const fechaCompleta = `${fechaSeleccionada}T${hora}`;
    setValue("fechaInicio", fechaCompleta);
    clearErrors("fechaInicio");
    if (horaFinSeleccionada && horaFinSeleccionada <= hora) {
      setHoraFinSeleccionada("");
      setValue("fechaFin", fechaCompleta);
    }
  };

  // Manejar selección de hora fin
  const handleHoraFinSeleccionada = (hora: string) => {
    if (!fechaSeleccionada) {
      toast.error("Primero selecciona una fecha", { duration: 2000 });
      return;
    }
    if (!horaInicioSeleccionada) {
      toast.error("Primero selecciona la hora de inicio", { duration: 2000 });
      return;
    }
    if (hora <= horaInicioSeleccionada) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio", { duration: 2000 });
      return;
    }
    setHoraFinSeleccionada(hora);
    const fechaCompleta = `${fechaSeleccionada}T${hora}`;
    setValue("fechaFin", fechaCompleta);
    clearErrors("fechaFin");
  };

  // Resetear cuando cambia el espacio
  useEffect(() => {
    if (espacioComunId) {
      setFechaSeleccionada("");
      setHoraInicioSeleccionada("");
      setHoraFinSeleccionada("");
      setValue("fechaInicio", "");
      setValue("fechaFin", "");
    }
  }, [espacioComunId, setValue]);

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
      setFechaSeleccionada("");
      setHoraInicioSeleccionada("");
      setHoraFinSeleccionada("");
      setMesActual(new Date());
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["usuario-reservas"] });
      queryClient.invalidateQueries({ queryKey: ["usuario-mis-reservas"] });
      queryClient.invalidateQueries({ queryKey: ["usuario-reservas-semana"] });
      queryClient.invalidateQueries({ queryKey: ["reservas-activas"] });
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
    if (!esDiaDisponibleWrapper(data.fechaInicio)) {
      toast.error("El día de inicio seleccionado no está disponible para reservas en este espacio", {
        duration: 3000,
      });
      return;
    }

    if (!esDiaDisponibleWrapper(data.fechaFin)) {
      toast.error("El día de fin seleccionado no está disponible para reservas en este espacio", {
        duration: 3000,
      });
      return;
    }

    if (!esHoraDisponibleWrapper(data.fechaInicio)) {
      toast.error("La hora de inicio seleccionada no está disponible. Verifica los horarios y reservas existentes", {
        duration: 3000,
      });
      return;
    }

    if (!esHoraDisponibleWrapper(data.fechaFin)) {
      toast.error("La hora de fin seleccionada no está disponible. Verifica los horarios y reservas existentes", {
        duration: 3000,
      });
      return;
    }

    if (!esRangoHorasDisponibleWrapper(data.fechaInicio, data.fechaFin)) {
      toast.error("El rango de horas seleccionado no está disponible. Hay reservas que se solapan", {
        duration: 3000,
      });
      return;
    }

    // Convertir fechas de datetime-local a ISO string con timezone offset explícito
    const convertirFechaLocal = (fechaLocal: string): string => {
      if (!fechaLocal) return "";
      if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
        return fechaLocal;
      }
      if (!fechaLocal.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        console.warn("Formato de fecha no reconocido:", fechaLocal);
        return fechaLocal;
      }
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMins = Math.abs(offsetMinutes) % 60;
      const offsetSign = offsetMinutes >= 0 ? '-' : '+';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
      const resultado = fechaLocal + `:00${offsetString}`;
      return resultado;
    };
    
    const fechaInicioISO = convertirFechaLocal(data.fechaInicio);
    const fechaFinISO = convertirFechaLocal(data.fechaFin);

    await crearReservaMutation.mutateAsync({
      espacioComunId: data.espacioComunId,
      fechaInicio: fechaInicioISO,
      fechaFin: fechaFinISO,
      motivo: data.motivo,
    });
  };

  const handleClose = () => {
    if (!crearReservaMutation.isPending) {
      reset();
      setFechaSeleccionada("");
      setHoraInicioSeleccionada("");
      setHoraFinSeleccionada("");
      setMesActual(new Date());
      setCreateDialogOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCreateDialogOpen(true);
    } else {
      handleClose();
    }
  };

  const getEstadoBadge = (estado: ReservaEstado) => {
    return <BadgeEstado estado={estado} />;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mis Reservas</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Gestiona tus reservas de espacios comunes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <IconPlus className="size-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Formulario de Reserva */}
      <FormularioReserva
        open={createDialogOpen}
        onOpenChange={handleOpenChange}
        espaciosDisponibles={espaciosDisponibles}
        espacioSeleccionado={espacioSeleccionado}
        disponibilidad={disponibilidad || null}
        horariosDisponibilidad={horariosDisponibilidad}
        fechaSeleccionada={fechaSeleccionada}
        horaInicioSeleccionada={horaInicioSeleccionada}
        horaFinSeleccionada={horaFinSeleccionada}
        mesActual={mesActual}
        minHora={minHora}
        maxHora={maxHora}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        clearErrors={clearErrors}
        onMesChange={setMesActual}
        onFechaSeleccionada={handleFechaSeleccionada}
        onHoraInicioSeleccionada={handleHoraInicioSeleccionada}
        onHoraFinSeleccionada={handleHoraFinSeleccionada}
        onSubmit={handleSubmit(onSubmit)}
        isPending={crearReservaMutation.isPending}
        esDiaDisponibleCalendario={esDiaDisponibleCalendarioWrapper}
        tieneHorasDisponibles={tieneHorasDisponiblesWrapper}
      />

      {/* Calendario Semanal */}
      <CalendarioSemanal
        reservasSemana={reservasSemana}
        isLoading={semanaLoading}
        selectedFecha={selectedFecha}
        onSemanaChange={(direccion) => {
          const nuevaFecha = new Date(selectedFecha);
          nuevaFecha.setDate(selectedFecha.getDate() + (direccion === 'siguiente' ? 7 : -7));
          setSelectedFecha(nuevaFecha);
        }}
        onHoyClick={() => setSelectedFecha(new Date())}
      />

      {/* Historial de Reservas */}
      <HistorialReservas
        reservas={misReservasResponse?.data || []}
        total={misReservasResponse?.total || 0}
        totalPages={misReservasResponse?.totalPages || 0}
        isLoading={misReservasLoading}
        page={page}
        onPageChange={setPage}
        getEstadoBadge={getEstadoBadge}
      />
    </div>
  );
}

export default ReservationsPage;
