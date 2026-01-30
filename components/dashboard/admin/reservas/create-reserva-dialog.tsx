"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { CreateReservaRequest, EspacioComun, HorarioDisponibilidad, DisponibilidadCompletaResponse, Unidad } from "@/types/types";

const reservaSchema = z.object({
  espacioComunId: z.string().min(1, "El espacio común es requerido"),
  unidadId: z.string().optional(),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  motivo: z.string().optional(),
  // Campos opcionales
  nombre: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  casa: z.string().optional(),
  modoPago: z.enum(["EFECTIVO", "DATAFONO", "TRANSFERENCIA"]).optional(),
  estadoPago: z.enum(["PENDIENTE", "APROBADO", "RECHAZADO"]).optional(),
  recibo: z.any().optional(), // FileList
}).refine((data) => new Date(data.fechaFin) > new Date(data.fechaInicio), {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fechaFin"],
});

type ReservaFormData = z.infer<typeof reservaSchema>;

interface CreateReservaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReservaDialog({
  open,
  onOpenChange,
}: CreateReservaDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  // Obtener espacios comunes
  const { data: espacios = [] } = useQuery<EspacioComun[]>({
    queryKey: ["espacios-comunes"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/reservas/espacios?activo=true");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: open,
  });

  // Obtener unidades para el selector
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: open,
  });

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
      unidadId: "",
      fechaInicio: "",
      fechaFin: "",
      motivo: "",
      nombre: "",
      correo: "",
      casa: "",
      modoPago: undefined,
      estadoPago: "PENDIENTE",
    },
  });

  const espacioComunId = watch("espacioComunId");
  const fechaInicio = watch("fechaInicio");
  const fechaFin = watch("fechaFin");
  const modoPago = watch("modoPago");
  const selectedUnidadId = watch("unidadId");

  const [unidadComboboxOpen, setUnidadComboboxOpen] = useState(false);

  // Estado para el calendario visual (declarar antes de los useEffect que los usan)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");
  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState<string>("");
  const [horaFinSeleccionada, setHoraFinSeleccionada] = useState<string>("");
  const [mesActual, setMesActual] = useState(new Date());

  // Obtener el espacio común seleccionado
  const espacioSeleccionado = espacios.find((e) => e.id === espacioComunId);

  // Obtener disponibilidad completa cuando se selecciona un espacio
  const { data: disponibilidad } = useQuery<DisponibilidadCompletaResponse>({
    queryKey: ["disponibilidad-completa", espacioComunId],
    queryFn: async () => {
      if (!espacioComunId) return null;
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(`/reservas/espacios/${espacioComunId}/disponibilidad-completa`);
      return response.data;
    },
    enabled: !!espacioComunId && open,
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

  // Obtener días disponibles (para mostrar información)
  const diasDisponibles = useMemo(() => {
    if (!horariosDisponibilidad || horariosDisponibilidad.length === 0) return null;
    return horariosDisponibilidad.map((h) => h.dia);
  }, [horariosDisponibilidad]);

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

  // Obtener solo horas disponibles (para compatibilidad)
  const obtenerHorasDisponibles = (fechaStr: string): string[] => {
    return obtenerTodasLasHoras(fechaStr)
      .filter(h => !h.ocupada && !h.pasada)
      .map(h => h.hora);
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

  const onSubmit = async (data: ReservaFormData) => {
    setLoading(true);

    try {
      // Validar que el día esté disponible
      if (!esDiaDisponible(data.fechaInicio)) {
        toast.error("El día de inicio seleccionado no está disponible para reservas en este espacio", {
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      if (!esDiaDisponible(data.fechaFin)) {
        toast.error("El día de fin seleccionado no está disponible para reservas en este espacio", {
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      // Validar que las horas estén disponibles
      if (!esHoraDisponible(data.fechaInicio)) {
        toast.error("La hora de inicio seleccionada no está disponible. Verifica los horarios y reservas existentes", {
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      if (!esHoraDisponible(data.fechaFin)) {
        toast.error("La hora de fin seleccionada no está disponible. Verifica los horarios y reservas existentes", {
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      // Validar que el rango completo esté disponible
      if (!esRangoHorasDisponible(data.fechaInicio, data.fechaFin)) {
        toast.error("El rango de horas seleccionado no está disponible. Hay reservas que se solapan", {
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      const axiosInstance = getAxiosInstance(subdomain);

      // Convertir fechas de datetime-local a ISO string con timezone offset explícito
      // Según documentación: formato "2026-01-02T11:00:00-05:00" para 11:00 AM hora local (Colombia UTC-5)
      // datetime-local devuelve "YYYY-MM-DDTHH:mm" que es la hora LOCAL exacta del usuario
      // NO convertimos a UTC, solo agregamos el offset para que el backend sepa la zona horaria
      // Ejemplo: Usuario selecciona "2026-01-02T09:00" → Enviamos "2026-01-02T09:00:00-05:00"
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
        // getTimezoneOffset() devuelve minutos: positivo = estamos detrás de UTC
        // Para Colombia UTC-5: getTimezoneOffset() = 300 → queremos "-05:00"
        const offsetMinutes = new Date().getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes >= 0 ? '-' : '+';
        const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

        // Agregar segundos y el offset: "YYYY-MM-DDTHH:mm:00-05:00"
        // CRÍTICO: Mantenemos la hora exacta que el usuario ingresó, NO la convertimos
        const resultado = fechaLocal + `:00${offsetString}`;
        return resultado;
      };

      const fechaInicioISO = convertirFechaLocal(data.fechaInicio);
      const fechaFinISO = convertirFechaLocal(data.fechaFin);

      console.log("🔍 DEBUG FECHAS:");
      console.log("  Entrada inicio:", data.fechaInicio);
      console.log("  Salida inicio:", fechaInicioISO);
      console.log("  Entrada fin:", data.fechaFin);
      console.log("  Salida fin:", fechaFinISO);

      const formData = new FormData();
      formData.append("espacioComunId", data.espacioComunId);
      if (data.unidadId) formData.append("unidadId", data.unidadId);
      formData.append("fechaInicio", fechaInicioISO);
      formData.append("fechaFin", fechaFinISO);
      if (data.motivo) formData.append("motivo", data.motivo);

      // Nuevos campos
      if (data.nombre) formData.append("nombre", data.nombre);
      if (data.correo) formData.append("correo", data.correo);
      if (data.casa) formData.append("casa", data.casa); // "casa" se envía tal cual
      if (data.modoPago) formData.append("modoPago", data.modoPago);
      if (data.estadoPago) formData.append("estadoPago", data.estadoPago);

      // Archivo de recibo
      if (data.recibo && data.recibo.length > 0) {
        formData.append("recibo", data.recibo[0]);
      }

      console.log("📤 Enviando FormData...");

      await axiosInstance.post("/reservas", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Reserva creada exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["reservas"] });

      reset();
      setFechaSeleccionada("");
      setHoraInicioSeleccionada("");
      setHoraFinSeleccionada("");
      setMesActual(new Date());
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear la reserva";

      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setFechaSeleccionada("");
      setHoraInicioSeleccionada("");
      setHoraFinSeleccionada("");
      setMesActual(new Date());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                disabled={loading || espacios.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {espacios.length === 0 ? "Cargando espacios..." : "Selecciona un espacio"}
                </option>
                {espacios.map((espacio) => (
                  <option key={espacio.id} value={espacio.id}>
                    {espacio.nombre} - {espacio.tipo}
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
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                      >
                        ← Anterior
                      </Button>
                      <span className="font-semibold">
                        {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                      >
                        Siguiente →
                      </Button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                        <div key={dia} className="text-center text-xs font-medium text-muted-foreground p-1">
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Calendario */}
                    <div className="grid grid-cols-7 gap-1">
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
                            disabled={!disponible || loading}
                            title={tooltip}
                            className={cn(
                              "aspect-square rounded-md text-sm transition-colors flex flex-col items-center justify-center",
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
                            <span className="text-xs opacity-70">{nombreDia}</span>
                            <span>{fecha.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Leyenda */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-primary"></div>
                        <span>Seleccionada</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-muted/50"></div>
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
                      <div className="border rounded-lg p-4 bg-muted/30 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-4 gap-2">
                          {obtenerTodasLasHoras(fechaSeleccionada).map(({ hora, ocupada, pasada }) => {
                            const seleccionada = horaInicioSeleccionada === hora;
                            const deshabilitada = ocupada || pasada;
                            return (
                              <button
                                key={hora}
                                type="button"
                                onClick={() => !deshabilitada && handleHoraInicioSeleccionada(hora)}
                                disabled={loading || deshabilitada}
                                className={cn(
                                  "px-3 py-2 rounded-md text-sm border transition-colors",
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
                        <div className="border rounded-lg p-4 bg-muted/30 max-h-48 overflow-y-auto">
                          <div className="grid grid-cols-4 gap-2">
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
                                    disabled={loading || deshabilitada}
                                    className={cn(
                                      "px-3 py-2 rounded-md text-sm border transition-colors",
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
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Fecha y Hora de Inicio *</FieldLabel>
                  <Input
                    type="datetime-local"
                    {...register("fechaInicio")}
                    disabled={loading || !espacioSeleccionado}
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
                    disabled={loading || !espacioSeleccionado}
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
                disabled={loading}
              />
              {errors.motivo && (
                <FieldError>{errors.motivo.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Nombre (Opcional)</FieldLabel>
                <Input
                  {...register("nombre")}
                  placeholder="Nombre del responsable"
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel>Correo (Opcional)</FieldLabel>
                <Input
                  {...register("correo")}
                  placeholder="correo@ejemplo.com"
                  type="email"
                  disabled={loading}
                />
                {errors.correo && (
                  <FieldError>{errors.correo.message}</FieldError>
                )}
              </Field>
            </div>
            <Field className="flex flex-col">
              <FieldLabel>Unidad / Casa (Opcional)</FieldLabel>
              <Popover open={unidadComboboxOpen} onOpenChange={setUnidadComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={unidadComboboxOpen}
                    disabled={loading || unidades.length === 0}
                    className={cn(
                      "w-full justify-between font-normal",
                      !selectedUnidadId && "text-muted-foreground"
                    )}
                  >
                    {selectedUnidadId
                      ? (() => {
                        const u = unidades.find((u) => u.id === selectedUnidadId);
                        return u ? `${u.identificador} - ${u.tipo}` : "Seleccionar unidad...";
                      })()
                      : "Seleccionar unidad..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar unidad..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron unidades.</CommandEmpty>
                      <CommandGroup>
                        {unidades.map((unidad) => (
                          <CommandItem
                            key={unidad.id}
                            value={`${unidad.identificador} ${unidad.tipo}`}
                            onSelect={() => {
                              setValue("unidadId", unidad.id === selectedUnidadId ? "" : unidad.id);
                              setUnidadComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUnidadId === unidad.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {unidad.identificador} - {unidad.tipo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Si seleccionas una unidad, la reserva quedará asociada a ella.
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Modo de Pago</FieldLabel>
                <select
                  {...register("modoPago")}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">Seleccione...</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DATAFONO">Datáfono</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </Field>

              <Field>
                <FieldLabel>Estado del Pago</FieldLabel>
                <select
                  {...register("estadoPago")}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADO">Aprobado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </Field>
            </div>

            {modoPago && (
              <Field>
                <FieldLabel>Comprobante de Pago {modoPago === 'EFECTIVO' ? '(Foto recibo)' : modoPago === 'DATAFONO' ? '(Voucher)' : '(Comprobante)'}</FieldLabel>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  {...register("recibo")}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: JPG, PNG, PDF
                </p>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  );
}

