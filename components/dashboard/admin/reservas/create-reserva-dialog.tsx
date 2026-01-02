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
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { CreateReservaRequest, EspacioComun, HorarioDisponibilidad } from "@/types/types";

const reservaSchema = z.object({
  espacioComunId: z.string().min(1, "El espacio común es requerido"),
  unidadId: z.string().optional(),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  motivo: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      espacioComunId: "",
      unidadId: "",
      fechaInicio: "",
      fechaFin: "",
      motivo: "",
    },
  });

  const espacioComunId = watch("espacioComunId");
  const fechaInicio = watch("fechaInicio");

  // Obtener el espacio común seleccionado
  const espacioSeleccionado = espacios.find((e) => e.id === espacioComunId);

  // Parsear horarios de disponibilidad
  const horariosDisponibilidad = useMemo(() => {
    if (!espacioSeleccionado?.horariosDisponibilidad) return null;
    try {
      return JSON.parse(espacioSeleccionado.horariosDisponibilidad) as HorarioDisponibilidad[];
    } catch {
      return null;
    }
  }, [espacioSeleccionado]);

  // Función para verificar si una fecha/hora está disponible
  const esHoraDisponible = (fechaHora: string): boolean => {
    if (!fechaHora || !horariosDisponibilidad || horariosDisponibilidad.length === 0) {
      return true; // Si no hay horarios definidos, permitir cualquier hora
    }

    const fecha = new Date(fechaHora);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const horaMinuto = fecha.toTimeString().slice(0, 5); // "HH:mm"

    // Buscar si hay un horario para este día
    const horarioDia = horariosDisponibilidad.find((h) => h.dia === diaSemana);
    
    if (!horarioDia) {
      return false; // No hay horario disponible para este día
    }

    // Verificar si la hora está dentro del rango permitido
    return horaMinuto >= horarioDia.horaInicio && horaMinuto <= horarioDia.horaFin;
  };

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

  const onSubmit = async (data: ReservaFormData) => {
    setLoading(true);

    try {
      // Validar que las horas estén dentro de los horarios disponibles
      if (horariosDisponibilidad && horariosDisponibilidad.length > 0) {
        if (!esHoraDisponible(data.fechaInicio)) {
          toast.error("La hora de inicio seleccionada no está disponible para este espacio", {
            duration: 3000,
          });
          setLoading(false);
          return;
        }
        if (!esHoraDisponible(data.fechaFin)) {
          toast.error("La hora de fin seleccionada no está disponible para este espacio", {
            duration: 3000,
          });
          setLoading(false);
          return;
        }
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
      
      const requestData: CreateReservaRequest = {
        espacioComunId: data.espacioComunId,
        unidadId: data.unidadId || undefined,
        fechaInicio: fechaInicioISO,
        fechaFin: fechaFinISO,
        motivo: data.motivo || undefined,
      };

      console.log("📤 Request completo:", JSON.stringify(requestData, null, 2));

      await axiosInstance.post("/reservas", requestData);

      toast.success("Reserva creada exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["reservas"] });

      reset();
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

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Fecha y Hora de Inicio *</FieldLabel>
                <Input
                  type="datetime-local"
                  {...register("fechaInicio")}
                  disabled={loading}
                />
                {errors.fechaInicio && (
                  <FieldError>{errors.fechaInicio.message}</FieldError>
                )}
                {espacioSeleccionado && horariosDisponibilidad && horariosDisponibilidad.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Horarios: {minHora} - {maxHora} (solo días disponibles)
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel>Fecha y Hora de Fin *</FieldLabel>
                <Input
                  type="datetime-local"
                  {...register("fechaFin")}
                  disabled={loading}
                  min={fechaInicio || undefined}
                />
                {errors.fechaFin && (
                  <FieldError>{errors.fechaFin.message}</FieldError>
                )}
              </Field>
            </div>

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
    </Dialog>
  );
}

