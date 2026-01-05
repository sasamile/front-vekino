"use client";

import { useState, useEffect, useMemo } from "react";
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
  DialogFooter,
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
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Reserva, ReservaEstado, EspacioComun, CreateReservaRequest, HorarioDisponibilidad, DisponibilidadCompletaResponse } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
      // Intentar usar el endpoint de usuario, si no existe usar el de admin
      try {
        const response = await axiosInstance.get(`/usuario/reservas/espacios/${espacioComunId}/disponibilidad-completa`);
      return response.data;
      } catch {
        // Fallback al endpoint de admin si el de usuario no existe
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

  // Función auxiliar para parsear fecha datetime-local sin conversión de timezone
  const parsearFechaLocal = (fechaLocal: string): { fechaStr: string; horaMinuto: string; diaSemana: number } | null => {
    if (!fechaLocal) return null;
    
    // datetime-local viene como "YYYY-MM-DDTHH:mm"
    const match = fechaLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return null;
    
    const [, año, mes, dia, hora, minuto] = match;
    const fechaStr = `${año}-${mes}-${dia}`;
    const horaMinuto = `${hora}:${minuto}`;
    
    // Crear fecha en hora local para obtener el día de la semana
    const fechaObj = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
    const diaSemana = fechaObj.getDay();
    
    return { fechaStr, horaMinuto, diaSemana };
  };

  // Función para verificar si un día está disponible
  const esDiaDisponible = (fecha: string): boolean => {
    if (!fecha || !disponibilidad) return true;
    
    const parsed = parsearFechaLocal(fecha);
    if (!parsed) return true;
    
    // Verificar si el día está en la lista de días no disponibles
    return !disponibilidad.diasNoDisponibles.includes(parsed.diaSemana);
  };

  // Función para verificar si una hora está disponible en una fecha específica
  const esHoraDisponible = (fechaHora: string): boolean => {
    if (!fechaHora) return true;

    const parsed = parsearFechaLocal(fechaHora);
    if (!parsed) return true;

    const { fechaStr, horaMinuto, diaSemana } = parsed;

    // Verificar si el día está disponible
    if (disponibilidad && disponibilidad.diasNoDisponibles.includes(diaSemana)) {
      return false;
    }

    // Verificar horarios de disponibilidad
    if (horariosDisponibilidad && horariosDisponibilidad.length > 0) {
      const horarioDia = horariosDisponibilidad.find((h) => h.dia === diaSemana);
      if (!horarioDia) {
        return false; // No hay horario disponible para este día
      }
      // Verificar si la hora está dentro del rango permitido
      if (horaMinuto < horarioDia.horaInicio || horaMinuto > horarioDia.horaFin) {
        return false;
      }
    }

    // Verificar si hay horas ocupadas para esta fecha
    if (disponibilidad?.horasOcupadasPorDia[fechaStr]) {
      const horasOcupadas = disponibilidad.horasOcupadasPorDia[fechaStr];
      // Verificar si la hora seleccionada se solapa con alguna hora ocupada
      for (const ocupada of horasOcupadas) {
        // Verificar si la hora está dentro del rango ocupado
        if (horaMinuto >= ocupada.horaInicio && horaMinuto < ocupada.horaFin) {
          return false;
        }
      }
    }

    return true;
  };

  // Función para verificar si un rango de horas está disponible
  const esRangoHorasDisponible = (fechaInicio: string, fechaFin: string): boolean => {
    if (!fechaInicio || !fechaFin) return true;

    const parsedInicio = parsearFechaLocal(fechaInicio);
    const parsedFin = parsearFechaLocal(fechaFin);
    
    if (!parsedInicio || !parsedFin) return true;

    // Si las fechas son diferentes, verificar cada día
    if (parsedInicio.fechaStr !== parsedFin.fechaStr) {
      // Por ahora, solo validamos que ambas fechas sean del mismo día
      // Para reservas multi-día, se necesitaría una validación más compleja
      return false;
    }

    // Verificar que ambas horas estén disponibles
    if (!esHoraDisponible(fechaInicio) || !esHoraDisponible(fechaFin)) {
      return false;
    }

    // Verificar que no haya horas ocupadas entre inicio y fin
    if (disponibilidad?.horasOcupadasPorDia[parsedInicio.fechaStr]) {
      const horasOcupadas = disponibilidad.horasOcupadasPorDia[parsedInicio.fechaStr];
      const horaInicio = parsedInicio.horaMinuto;
      const horaFin = parsedFin.horaMinuto;

      for (const ocupada of horasOcupadas) {
        // Verificar solapamiento: si el rango seleccionado se solapa con alguna hora ocupada
        if (
          (horaInicio < ocupada.horaFin && horaFin > ocupada.horaInicio)
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Validar fecha cuando cambia (solo si NO estamos usando el calendario visual)
  useEffect(() => {
    // Solo validar si no estamos usando el calendario visual (cuando fechaSeleccionada está vacía)
    if (fechaInicio && espacioComunId && !fechaSeleccionada) {
      // Verificar si el día está disponible
      if (!esDiaDisponible(fechaInicio)) {
        setError("fechaInicio", {
          type: "manual",
          message: "Este día no está disponible para reservas en este espacio",
        });
        return;
      }
      
      // Verificar si la hora está disponible
      if (!esHoraDisponible(fechaInicio)) {
        setError("fechaInicio", {
          type: "manual",
          message: "Esta hora no está disponible. Verifica los horarios y reservas existentes",
        });
        return;
      }

      clearErrors("fechaInicio");
    } else if (fechaSeleccionada && horaInicioSeleccionada) {
      // Si estamos usando el calendario visual, limpiar errores
      clearErrors("fechaInicio");
    }
  }, [fechaInicio, espacioComunId, disponibilidad, fechaSeleccionada, horaInicioSeleccionada, setError, clearErrors]);

  // Validar fecha fin cuando cambia (solo si NO estamos usando el calendario visual)
  useEffect(() => {
    // Solo validar si no estamos usando el calendario visual
    if (fechaFin && fechaInicio && espacioComunId && !fechaSeleccionada) {
      // Verificar si el día está disponible
      if (!esDiaDisponible(fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "Este día no está disponible para reservas en este espacio",
        });
        return;
      }
      
      // Verificar si la hora está disponible
      if (!esHoraDisponible(fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "Esta hora no está disponible. Verifica los horarios y reservas existentes",
        });
        return;
      }

      // Verificar que el rango completo esté disponible
      if (!esRangoHorasDisponible(fechaInicio, fechaFin)) {
        setError("fechaFin", {
          type: "manual",
          message: "El rango de horas seleccionado no está disponible. Hay reservas que se solapan",
        });
        return;
      }

      clearErrors("fechaFin");
    } else if (fechaSeleccionada && horaFinSeleccionada) {
      // Si estamos usando el calendario visual, limpiar errores
      clearErrors("fechaFin");
    }
  }, [fechaFin, fechaInicio, espacioComunId, disponibilidad, fechaSeleccionada, horaFinSeleccionada, setError, clearErrors]);

  // Obtener el rango de horas mínimo y máximo de todos los días
  const getGlobalMinMaxTime = () => {
    if (!horariosDisponibilidad || horariosDisponibilidad.length === 0) {
      return { min: "", max: "" };
    }

    // Encontrar la hora mínima y máxima de todos los horarios
    const horasInicio = horariosDisponibilidad.map((h) => h.horaInicio).sort();
    const horasFin = horariosDisponibilidad.map((h) => h.horaFin).sort();
    
    return {
      minHora: horasInicio[0],
      maxHora: horasFin[horasFin.length - 1],
    };
  };

  const { minHora, maxHora } = getGlobalMinMaxTime();

  // Función auxiliar para obtener el día de la semana de una fecha string (YYYY-MM-DD)
  // Retorna 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  const obtenerDiaSemana = (fechaStr: string): number => {
    if (!fechaStr || !fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return -1;
    }
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    // Crear fecha en hora local (mes es 0-indexed en Date: 0=Enero, 11=Diciembre)
    const fecha = new Date(año, mes - 1, dia);
    const diaSemana = fecha.getDay();
    return diaSemana;
  };

  // Generar días del mes actual con espacios en blanco al inicio
  const diasDelMes = useMemo(() => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const dias: Array<{ fecha: Date | null; diaSemana: number | null; fechaStr: string | null }> = [];
    
    // Agregar espacios en blanco para alinear el primer día del mes con el día de la semana correcto
    const diaSemanaPrimerDia = primerDia.getDay(); // 0=Domingo, 1=Lunes, etc.
    for (let i = 0; i < diaSemanaPrimerDia; i++) {
      dias.push({ fecha: null, diaSemana: null, fechaStr: null });
    }
    
    // Agregar los días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(año, mes, dia);
      const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      dias.push({
        fecha,
        diaSemana: fecha.getDay(),
        fechaStr,
      });
    }
    
    return dias;
  }, [mesActual]);

  // Verificar si un día está disponible según el día de la semana
  const esDiaDisponibleCalendario = (diaSemana: number, fechaStr: string): boolean => {
    if (!disponibilidad) return true;
    
    // Verificar día de la semana
    if (disponibilidad.diasNoDisponibles.includes(diaSemana)) {
      return false;
    }
    
    return true;
  };

  // Verificar si un día tiene horas disponibles (ocupadas o pasadas)
  const tieneHorasDisponibles = (fechaStr: string): boolean => {
    const horasDelDia = obtenerTodasLasHoras(fechaStr);
    return horasDelDia.some(h => !h.ocupada && !h.pasada);
  };

  // Obtener todas las horas del horario (disponibles, ocupadas y pasadas)
  const obtenerTodasLasHoras = (fechaStr: string): Array<{ hora: string; ocupada: boolean; pasada: boolean }> => {
    if (!disponibilidad || !horariosDisponibilidad) {
      return [];
    }
    
    // Usar la función auxiliar para obtener el día de la semana de manera consistente
    const diaSemana = obtenerDiaSemana(fechaStr);
    
    // Verificar si el día está disponible
    if (disponibilidad.diasNoDisponibles.includes(diaSemana)) {
      return [];
    }
    
    // Obtener horario del día
    const horarioDia = horariosDisponibilidad.find((h) => h.dia === diaSemana);
    if (!horarioDia) {
      return [];
    }
    
    // Obtener fecha y hora actual
    const ahora = new Date();
    const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    
    // Generar todas las horas
    const horas: Array<{ hora: string; ocupada: boolean; pasada: boolean }> = [];
    const [horaInicio, minutoInicio] = horarioDia.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = horarioDia.horaFin.split(':').map(Number);
    
    // Obtener horas ocupadas para esta fecha
    const horasOcupadas = disponibilidad.horasOcupadasPorDia[fechaStr] || [];
    
    // Convertir horas ocupadas a minutos para comparación más fácil
    const rangosOcupados = horasOcupadas.map(ocupada => {
      const [ocupadaHoraInicio, ocupadaMinutoInicio] = ocupada.horaInicio.split(':').map(Number);
      const [ocupadaHoraFin, ocupadaMinutoFin] = ocupada.horaFin.split(':').map(Number);
      return {
        inicioMinutos: ocupadaHoraInicio * 60 + ocupadaMinutoInicio,
        finMinutos: ocupadaHoraFin * 60 + ocupadaMinutoFin,
      };
    });
    
    // Generar todas las horas posibles en intervalos de 30 minutos
    // Incluir desde horaInicio:minutoInicio hasta horaFin:minutoFin (inclusive)
    const horaInicioMinutos = horaInicio * 60 + minutoInicio;
    const horaFinMinutos = horaFin * 60 + minutoFin;
    
    for (let minutosActuales = horaInicioMinutos; minutosActuales <= horaFinMinutos; minutosActuales += 30) {
      const hora = Math.floor(minutosActuales / 60);
      const minuto = minutosActuales % 60;
      const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
      
      // Verificar si esta hora está ocupada (verificar si está dentro de algún rango ocupado)
      const estaOcupada = rangosOcupados.some(rango => {
        // La hora está ocupada si está dentro del rango [inicio, fin]
        // Incluimos tanto el inicio como el fin porque:
        // - Si empieza a las 12:30, no podemos empezar otra reserva a las 12:30
        // - Si termina a las 18:00, no podemos empezar otra reserva a las 18:00 (el espacio está ocupado hasta las 18:00)
        return minutosActuales >= rango.inicioMinutos && minutosActuales <= rango.finMinutos;
      });
      
      // Verificar si la hora ya pasó (solo si es el mismo día)
      const esPasada = fechaStr === hoyStr && minutosActuales < horaActualMinutos;
      
      horas.push({ hora: horaStr, ocupada: estaOcupada, pasada: esPasada });
    }
    
    return horas;
  };

  // Manejar selección de fecha
  const handleFechaSeleccionada = (fechaStr: string, diaSemana: number) => {
    if (!esDiaDisponibleCalendario(diaSemana, fechaStr)) {
      toast.error("Este día no está disponible para reservas", { duration: 2000 });
      return;
    }
    
    setFechaSeleccionada(fechaStr);
    setHoraInicioSeleccionada("");
    setHoraFinSeleccionada("");
    
    // Limpiar errores cuando se selecciona una fecha válida
    clearErrors("fechaInicio");
    clearErrors("fechaFin");
    
    // Actualizar el formulario con valores por defecto (se actualizarán cuando se seleccione la hora)
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
    
    // Limpiar errores
    clearErrors("fechaInicio");
    
    // Si ya hay hora fin seleccionada y es menor o igual que la hora inicio, limpiarla
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
    
    // Limpiar errores
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
      // Invalidar todas las queries relacionadas con reservas
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
    // Validar que el día esté disponible
    if (!esDiaDisponible(data.fechaInicio)) {
      toast.error("El día de inicio seleccionado no está disponible para reservas en este espacio", {
        duration: 3000,
      });
      return;
    }

    if (!esDiaDisponible(data.fechaFin)) {
      toast.error("El día de fin seleccionado no está disponible para reservas en este espacio", {
        duration: 3000,
      });
      return;
    }

    // Validar que las horas estén disponibles
    if (!esHoraDisponible(data.fechaInicio)) {
      toast.error("La hora de inicio seleccionada no está disponible. Verifica los horarios y reservas existentes", {
        duration: 3000,
      });
      return;
    }

    if (!esHoraDisponible(data.fechaFin)) {
      toast.error("La hora de fin seleccionada no está disponible. Verifica los horarios y reservas existentes", {
        duration: 3000,
      });
      return;
    }

    // Validar que el rango completo esté disponible
    if (!esRangoHorasDisponible(data.fechaInicio, data.fechaFin)) {
      toast.error("El rango de horas seleccionado no está disponible. Hay reservas que se solapan", {
        duration: 3000,
      });
      return;
    }

    // Convertir fechas de datetime-local a ISO string con timezone offset explícito
    const convertirFechaLocal = (fechaLocal: string): string => {
      if (!fechaLocal) return "";
      
      // Si ya tiene formato ISO completo con offset o Z, retornarlo tal cual
      if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
        return fechaLocal;
      }
      
      // Verificar formato datetime-local: "YYYY-MM-DDTHH:mm"
      if (!fechaLocal.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        console.warn("Formato de fecha no reconocido:", fechaLocal);
        return fechaLocal;
      }
      
      // Obtener el offset de timezone del sistema
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMins = Math.abs(offsetMinutes) % 60;
      const offsetSign = offsetMinutes >= 0 ? '-' : '+';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
      
      // Agregar segundos y el offset: "YYYY-MM-DDTHH:mm:00-05:00"
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
    if (!amount || amount === 0) return "Gratis";
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

  // Calcular días de la semana
  const getDiasSemana = () => {
    const fecha = new Date(selectedFecha);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - diaSemana); // Ir al domingo de la semana
    
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  // Agrupar reservas por día
  const reservasPorDia = reservasSemana.reduce((acc, reserva) => {
    const fechaInicio = new Date(reserva.fechaInicio);
    const fechaStr = fechaInicio.toISOString().split('T')[0];
    
    if (!acc[fechaStr]) {
      acc[fechaStr] = [];
    }
    acc[fechaStr].push(reserva);
    return acc;
  }, {} as Record<string, Reserva[]>);

  // Navegar semana
  const cambiarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(selectedFecha);
    nuevaFecha.setDate(selectedFecha.getDate() + (direccion === 'siguiente' ? 7 : -7));
    setSelectedFecha(nuevaFecha);
  };

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatear fecha corta
  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
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
        <Dialog open={createDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <IconPlus className="size-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Crear Nueva Reserva</DialogTitle>
              <DialogDescription>
                Completa el formulario para crear una nueva reserva
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Espacio Común *</FieldLabel>
                  <select
                    {...register("espacioComunId")}
                    disabled={crearReservaMutation.isPending || espaciosDisponibles.length === 0}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {espaciosDisponibles.length === 0 ? "Cargando espacios..." : "Selecciona un espacio"}
                    </option>
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

                {espacioSeleccionado && disponibilidad && (
                  <div className="space-y-4">
                  <Field>
                      <FieldLabel>Selecciona la Fecha *</FieldLabel>
                      <div className="border rounded-lg p-4 bg-muted/30">
                        {/* Navegación del mes */}
                        <div className="flex items-center justify-between mb-4 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                          >
                            <span className="hidden sm:inline">← Anterior</span>
                            <span className="sm:hidden">←</span>
                          </Button>
                          <span className="font-semibold text-sm sm:text-base text-center flex-1">
                            {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                          >
                            <span className="hidden sm:inline">Siguiente →</span>
                            <span className="sm:hidden">→</span>
                          </Button>
                        </div>

                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                            <div key={dia} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground p-0.5 sm:p-1">
                              {dia}
                            </div>
                          ))}
                        </div>

                        {/* Calendario */}
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                          {diasDelMes.map(({ fecha, diaSemana, fechaStr }, index) => {
                            // Si es un espacio en blanco (inicio del mes)
                            if (!fecha || !fechaStr) {
                              return <div key={`empty-${index}`} className="aspect-square" />;
                            }
                            
                            // Recalcular el día de la semana para asegurar consistencia
                            const diaSemanaCalculado = obtenerDiaSemana(fechaStr);
                            const disponiblePorDiaSemana = esDiaDisponibleCalendario(diaSemanaCalculado, fechaStr);
                            const tieneHoras = tieneHorasDisponibles(fechaStr);
                            const disponible = disponiblePorDiaSemana && tieneHoras;
                            const seleccionada = fechaSeleccionada === fechaStr;
                            const hoy = new Date();
                            const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                            const esHoy = fechaStr === hoyStr;
                            
                            // Nombre del día
                            const nombreDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemanaCalculado];
                            
                            // Tooltip explicativo
                            let tooltip = `${nombreDia} ${fecha.getDate()}`;
                            if (!disponiblePorDiaSemana) {
                              tooltip += " - Día no disponible";
                            } else if (!tieneHoras) {
                              tooltip += " - Sin horas disponibles";
                            }
                            
                            return (
                              <button
                                key={fechaStr}
                                type="button"
                                onClick={() => handleFechaSeleccionada(fechaStr, diaSemanaCalculado)}
                                disabled={!disponible || crearReservaMutation.isPending}
                                title={tooltip}
                                className={cn(
                                  "aspect-square rounded-md text-[10px] sm:text-sm transition-colors flex flex-col items-center justify-center",
                                  disponible
                                    ? seleccionada
                                      ? "bg-primary text-primary-foreground font-semibold"
                                      : esHoy
                                      ? "bg-primary/20 hover:bg-primary/30 font-medium border-2 border-primary"
                                      : "bg-background hover:bg-muted border border-input"
                                    : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50",
                                  "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                              >
                                <span className="text-[8px] sm:text-xs opacity-70 hidden sm:block">{nombreDia}</span>
                                <span className="font-medium">{fecha.getDate()}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Leyenda */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-[10px] sm:text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary"></div>
                            <span>Seleccionada</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-muted/50"></div>
                            <span>No disponible</span>
                          </div>
                        </div>
                      </div>
                      {errors.fechaInicio && (
                        <FieldError>{errors.fechaInicio.message}</FieldError>
                      )}
                    </Field>

                    {fechaSeleccionada && (
                      <>
                        <Field>
                          <FieldLabel>Hora de Inicio *</FieldLabel>
                          <div className="border rounded-lg p-2 sm:p-4 bg-muted/30 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                              {obtenerTodasLasHoras(fechaSeleccionada).map(({ hora, ocupada, pasada }) => {
                                const seleccionada = horaInicioSeleccionada === hora;
                                const deshabilitada = ocupada || pasada;
                                return (
                                  <button
                                    key={hora}
                                    type="button"
                                    onClick={() => !deshabilitada && handleHoraInicioSeleccionada(hora)}
                                    disabled={crearReservaMutation.isPending || deshabilitada}
                                    className={cn(
                                      "px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm border transition-colors",
                                      deshabilitada
                                        ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50 border-muted"
                                        : seleccionada
                                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                                        : "bg-background hover:bg-muted border-input"
                                    )}
                                    title={
                                      ocupada 
                                        ? "Esta hora está ocupada" 
                                        : pasada 
                                        ? "Esta hora ya pasó" 
                                        : ""
                                    }
                                  >
                                    {hora}
                                  </button>
                                );
                              })}
                            </div>
                            {obtenerTodasLasHoras(fechaSeleccionada).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No hay horas disponibles para este día
                              </p>
                            )}
                          </div>
                        </Field>

                        {horaInicioSeleccionada && (
                          <Field>
                            <FieldLabel>Hora de Fin *</FieldLabel>
                            <div className="border rounded-lg p-2 sm:p-4 bg-muted/30 max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                {obtenerTodasLasHoras(fechaSeleccionada)
                                  .filter(({ hora }) => hora > horaInicioSeleccionada)
                                  .map(({ hora, ocupada, pasada }) => {
                                    const seleccionada = horaFinSeleccionada === hora;
                                    const deshabilitada = ocupada || pasada;
                                    return (
                                      <button
                                        key={hora}
                                        type="button"
                                        onClick={() => !deshabilitada && handleHoraFinSeleccionada(hora)}
                                        disabled={crearReservaMutation.isPending || deshabilitada}
                                        className={cn(
                                          "px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm border transition-colors",
                                          deshabilitada
                                            ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50 border-muted"
                                            : seleccionada
                                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                                            : "bg-background hover:bg-muted border-input"
                                        )}
                                        title={
                                          ocupada 
                                            ? "Esta hora está ocupada" 
                                            : pasada 
                                            ? "Esta hora ya pasó" 
                                            : ""
                                        }
                                      >
                                        {hora}
                                      </button>
                                    );
                                  })}
                              </div>
                              {obtenerTodasLasHoras(fechaSeleccionada)
                                .filter(({ hora }) => hora > horaInicioSeleccionada).length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay horas disponibles después de {horaInicioSeleccionada}
                                  </p>
                              )}
                            </div>
                            {errors.fechaFin && (
                              <FieldError>{errors.fechaFin.message}</FieldError>
                            )}
                          </Field>
                        )}
                      </>
                    )}

                    {/* Información de disponibilidad */}
                    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                      {horariosDisponibilidad && horariosDisponibilidad.length > 0 && (
                        <p>
                          <span className="font-semibold">Horarios:</span> {minHora} - {maxHora}
                        </p>
                      )}
                      {disponibilidad.diasNoDisponibles.length > 0 && (
                        <p>
                          <span className="font-semibold">Días no disponibles:</span>{" "}
                          {disponibilidad.diasNoDisponibles.map(d => {
                            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                            return dias[d];
                          }).join(', ')}
                        </p>
                      )}
                      {fechaSeleccionada && disponibilidad.horasOcupadasPorDia[fechaSeleccionada] && (
                        <p>
                          <span className="font-semibold">Horas ocupadas este día:</span>{" "}
                          {disponibilidad.horasOcupadasPorDia[fechaSeleccionada].map(
                            (ocupada, idx) => `${ocupada.horaInicio} - ${ocupada.horaFin}`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(!espacioSeleccionado || !disponibilidad) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                      <FieldLabel>Fecha y Hora de Inicio *</FieldLabel>
                    <Input
                      type="datetime-local"
                      {...register("fechaInicio")}
                        disabled={crearReservaMutation.isPending || !espacioSeleccionado}
                    />
                    {errors.fechaInicio && (
                      <FieldError>{errors.fechaInicio.message}</FieldError>
                    )}
                  </Field>

                  <Field>
                      <FieldLabel>Fecha y Hora de Fin *</FieldLabel>
                    <Input
                      type="datetime-local"
                      {...register("fechaFin")}
                        disabled={crearReservaMutation.isPending || !espacioSeleccionado}
                        min={fechaInicio || undefined}
                    />
                    {errors.fechaFin && (
                      <FieldError>{errors.fechaFin.message}</FieldError>
                    )}
                  </Field>
                  </div>
                )}

                <Field>
                  <FieldLabel>Motivo</FieldLabel>
                  <Input
                    {...register("motivo")}
                    placeholder="Ej: Celebración de cumpleaños"
                    disabled={crearReservaMutation.isPending}
                  />
                  {errors.motivo && (
                    <FieldError>{errors.motivo.message}</FieldError>
                  )}
                </Field>

            
              </FieldGroup>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={crearReservaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearReservaMutation.isPending}>
                  {crearReservaMutation.isPending ? "Creando..." : "Crear Reserva"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reservas de la Semana - Calendario */}
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <IconCalendar className="size-4 sm:size-5" />
                Reservas de la Semana
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Reservas confirmadas para esta semana
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cambiarSemana('anterior')}
                className="flex-1 sm:flex-initial"
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFecha(new Date())}
                className="flex-1 sm:flex-initial"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cambiarSemana('siguiente')}
                className="flex-1 sm:flex-initial"
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {semanaLoading ? (
            <div className="space-y-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {/* Encabezados de días - Solo visible en desktop */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="hidden sm:block text-center text-xs sm:text-sm font-semibold text-muted-foreground pb-2"
                >
                  {dia}
                </div>
              ))}
              
              {/* Días de la semana */}
              {getDiasSemana().map((dia, index) => {
                const fechaStr = dia.toISOString().split('T')[0];
                const reservasDelDia = reservasPorDia[fechaStr] || [];
                const esHoy = fechaStr === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] sm:min-h-[120px] border rounded-lg p-2 sm:p-2",
                      esHoy && "border-primary border-2 bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "text-xs sm:text-sm font-medium mb-2",
                      esHoy && "text-primary font-bold"
                    )}>
                      {formatDateShort(dia)}
                    </div>
                    <div className="space-y-1">
                      {reservasDelDia.length > 0 ? (
                        reservasDelDia.map((reserva) => (
                        <div
                          key={reserva.id}
                            className="text-[10px] sm:text-xs p-1 sm:p-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                          title={`${reserva.espacioComun?.nombre || "Espacio"} - ${formatTime(reserva.fechaInicio)} - ${formatTime(reserva.fechaFin)}`}
                        >
                          <div className="font-semibold truncate">
                            {reserva.espacioComun?.nombre || "Espacio"}
                          </div>
                          <div className="text-muted-foreground">
                            {formatTime(reserva.fechaInicio)} - {formatTime(reserva.fechaFin)}
                          </div>
                        </div>
                        ))
                      ) : (
                        <div className="text-[10px] sm:text-xs text-muted-foreground text-center py-1">
                          Sin reservas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Reservas - Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reservas</CardTitle>
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
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : misReservasResponse && misReservasResponse.data.length > 0 ? (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Espacio
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Fecha Inicio
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Fecha Fin
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Estado
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Motivo
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                        Personas
                      </th>
                      <th className="text-right p-3 text-sm font-semibold text-muted-foreground">
                        Precio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {misReservasResponse.data.map((reserva) => (
                      <tr
                        key={reserva.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <IconMapPin className="size-4 text-muted-foreground" />
                            <span className="font-medium">
                              {reserva.espacioComun?.nombre || "Espacio"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(reserva.fechaInicio)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(reserva.fechaFin)}
                        </td>
                        <td className="p-3">
                          {getEstadoBadge(reserva.estado)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {reserva.motivo || "-"}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {reserva.cantidadPersonas ? (
                            <div className="flex items-center gap-1">
                              <IconUsers className="size-3" />
                              {reserva.cantidadPersonas}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(reserva.precioTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de cards para móvil */}
              <div className="md:hidden space-y-3">
                {misReservasResponse.data.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <IconMapPin className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">
                          {reserva.espacioComun?.nombre || "Espacio"}
                        </span>
                      </div>
                      {getEstadoBadge(reserva.estado)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Inicio</div>
                          <div className="font-medium">{formatDate(reserva.fechaInicio)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconClock className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Fin</div>
                          <div className="font-medium">{formatDate(reserva.fechaFin)}</div>
                        </div>
                      </div>
                      {reserva.motivo && (
                        <div>
                          <div className="text-muted-foreground text-xs">Motivo</div>
                          <div className="font-medium">{reserva.motivo}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {reserva.cantidadPersonas && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <IconUsers className="size-3" />
                              {reserva.cantidadPersonas} personas
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-primary">
                          {formatCurrency(reserva.precioTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            </>
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
