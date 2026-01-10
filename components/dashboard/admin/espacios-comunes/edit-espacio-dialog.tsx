"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import type { EspacioComun, EspacioComunTipo, UpdateEspacioComunRequest, HorarioDisponibilidad } from "@/types/types";

const espacioUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional().or(z.literal("")),
  tipo: z.enum([
    "SALON_SOCIAL",
    "ZONA_BBQ",
    "SAUNA",
    "CASA_EVENTOS",
    "GIMNASIO",
    "PISCINA",
    "CANCHA_DEPORTIVA",
    "PARQUEADERO",
    "OTRO",
  ]).optional(),
  capacidad: z.number().min(1, "La capacidad debe ser mayor a 0").optional().or(z.nan()),
  descripcion: z.string().optional(),
  unidadTiempo: z.literal("HORAS").optional(),
  precioPorUnidad: z.number().min(0, "El precio debe ser mayor o igual a 0").optional().or(z.nan()),
  activo: z.boolean().optional(),
  requiereAprobacion: z.boolean().optional(),
  horariosDisponibilidad: z.string().optional(),
}).partial();

type EspacioUpdateFormData = z.infer<typeof espacioUpdateSchema>;

interface EditEspacioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  espacio: EspacioComun | null;
}

const TIPO_OPTIONS: { value: EspacioComunTipo; label: string }[] = [
  { value: "SALON_SOCIAL", label: "Salón Social" },
  { value: "ZONA_BBQ", label: "Zona BBQ" },
  { value: "SAUNA", label: "Sauna" },
  { value: "CASA_EVENTOS", label: "Casa de Eventos" },
  { value: "GIMNASIO", label: "Gimnasio" },
  { value: "PISCINA", label: "Piscina" },
  { value: "CANCHA_DEPORTIVA", label: "Cancha Deportiva" },
  { value: "PARQUEADERO", label: "Parqueadero" },
  { value: "OTRO", label: "Otro" },
];

// Unidad de tiempo fija en HORAS

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function EditEspacioDialog({
  open,
  onOpenChange,
  espacio,
}: EditEspacioDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  
  // Estado para horarios
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("22:00");
  const espacioIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EspacioUpdateFormData>({
    resolver: zodResolver(espacioUpdateSchema),
    defaultValues: {
      nombre: "",
      tipo: "SALON_SOCIAL",
      capacidad: 1,
      descripcion: "",
      unidadTiempo: "HORAS",
      precioPorUnidad: 0,
      activo: true,
      requiereAprobacion: true,
      horariosDisponibilidad: "",
    },
  });

  // Función para convertir horarios a JSON string
  const generarHorariosJSON = (): string => {
    const horarios: HorarioDisponibilidad[] = diasSeleccionados.map((dia) => ({
      dia,
      horaInicio,
      horaFin,
    }));
    return JSON.stringify(horarios);
  };

  // Función para parsear JSON a estado
  const parsearHorariosJSON = (jsonString: string) => {
    try {
      const horarios: HorarioDisponibilidad[] = JSON.parse(jsonString);
      if (Array.isArray(horarios) && horarios.length > 0) {
        const dias = horarios.map((h) => h.dia);
        setDiasSeleccionados(dias);
        // Usar el primer horario como referencia (asumimos que todos tienen el mismo horario)
        if (horarios[0]) {
          setHoraInicio(horarios[0].horaInicio);
          setHoraFin(horarios[0].horaFin);
        }
      }
    } catch (error) {
      console.error("Error parsing horarios:", error);
    }
  };

  // Función para seleccionar/deseleccionar día
  const toggleDia = (dia: number) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  };

  // Seleccionar todos los días
  const seleccionarTodos = () => {
    setDiasSeleccionados([0, 1, 2, 3, 4, 5, 6]);
  };

  // Deseleccionar todos
  const deseleccionarTodos = () => {
    setDiasSeleccionados([]);
  };

  // Seleccionar días laborales (Lunes a Viernes)
  const seleccionarLaborales = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5]);
  };

  // Seleccionar fines de semana
  const seleccionarFinesSemana = () => {
    setDiasSeleccionados([0, 6]);
  };

  useEffect(() => {
    if (espacio && espacio.id !== espacioIdRef.current) {
      espacioIdRef.current = espacio.id;
      reset({
        nombre: espacio.nombre,
        tipo: espacio.tipo,
        capacidad: espacio.capacidad,
        descripcion: espacio.descripcion || "",
        unidadTiempo: "HORAS",
        precioPorUnidad: espacio.precioPorUnidad,
        activo: espacio.activo,
        requiereAprobacion: espacio.requiereAprobacion,
        horariosDisponibilidad: espacio.horariosDisponibilidad,
      });
      // Parsear horarios del espacio
      if (espacio.horariosDisponibilidad) {
        parsearHorariosJSON(espacio.horariosDisponibilidad);
      }
    } else if (!espacio) {
      espacioIdRef.current = null;
      setDiasSeleccionados([]);
      setHoraInicio("09:00");
      setHoraFin("22:00");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio?.id, reset]); // Reset es estable de react-hook-form, pero necesitamos el check del ID

  const onSubmit = async (data: EspacioUpdateFormData) => {
    if (!espacio) return;

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      const updateData: UpdateEspacioComunRequest = {};
      
      if (data.nombre !== undefined && data.nombre !== "" && data.nombre !== espacio.nombre) {
        updateData.nombre = data.nombre;
      }
      if (data.tipo !== undefined && data.tipo !== espacio.tipo) {
        updateData.tipo = data.tipo;
      }
      if (data.capacidad !== undefined && !isNaN(data.capacidad) && data.capacidad !== espacio.capacidad) {
        updateData.capacidad = data.capacidad;
      }
      if (data.descripcion !== undefined && data.descripcion !== (espacio.descripcion || "")) {
        updateData.descripcion = data.descripcion;
      }
      // Siempre usar HORAS como unidad de tiempo
      if (espacio.unidadTiempo !== "HORAS") {
        updateData.unidadTiempo = "HORAS";
      }
      if (data.precioPorUnidad !== undefined && !isNaN(data.precioPorUnidad) && data.precioPorUnidad !== espacio.precioPorUnidad) {
        updateData.precioPorUnidad = data.precioPorUnidad;
      }
      if (data.activo !== undefined && data.activo !== espacio.activo) {
        updateData.activo = data.activo;
      }
      if (data.requiereAprobacion !== undefined && data.requiereAprobacion !== espacio.requiereAprobacion) {
        updateData.requiereAprobacion = data.requiereAprobacion;
      }
      // Generar JSON de horarios y comparar
      const nuevosHorariosJSON = generarHorariosJSON();
      if (nuevosHorariosJSON !== espacio.horariosDisponibilidad) {
        updateData.horariosDisponibilidad = nuevosHorariosJSON;
      }

      if (Object.keys(updateData).length === 0) {
        toast.error("No hay cambios para guardar", {
          duration: 2000,
        });
        setLoading(false);
        return;
      }

      await axiosInstance.put(`/reservas/espacios/${espacio.id}`, updateData);

      toast.success("Espacio común actualizado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["espacios-comunes"] });

      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al actualizar el espacio común";

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

  if (!espacio) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Espacio Común</DialogTitle>
          <DialogDescription>
            Modifica los campos que deseas actualizar del espacio {espacio.nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  {...register("nombre")}
                  placeholder="Ej: Salón Social"
                  disabled={loading}
                />
                {errors.nombre && (
                  <FieldError>{errors.nombre.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <select
                  {...register("tipo")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {TIPO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tipo && (
                  <FieldError>{errors.tipo.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <textarea
                {...register("descripcion")}
                placeholder="Descripción del espacio común"
                disabled={loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
              {errors.descripcion && (
                <FieldError>{errors.descripcion.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Capacidad (personas)</FieldLabel>
                <Input
                  type="number"
                  step="1"
                  {...register("capacidad", { valueAsNumber: true })}
                  placeholder="Ej: 50"
                  disabled={loading}
                />
                {errors.capacidad && (
                  <FieldError>{errors.capacidad.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Precio por Hora</FieldLabel>
                <Input
                  type="number"
                  step="1000"
                  {...register("precioPorUnidad", { valueAsNumber: true })}
                  placeholder="Ej: 50000"
                  disabled={loading}
                />
                {errors.precioPorUnidad && (
                  <FieldError>{errors.precioPorUnidad.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Horarios de Disponibilidad</FieldLabel>
              
              {/* Botones rápidos */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={seleccionarTodos}
                  disabled={loading}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={seleccionarLaborales}
                  disabled={loading}
                  className="text-xs"
                >
                  Lun-Vie
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={seleccionarFinesSemana}
                  disabled={loading}
                  className="text-xs"
                >
                  Fines de Semana
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deseleccionarTodos}
                  disabled={loading}
                  className="text-xs"
                >
                  Ninguno
                </Button>
              </div>

              {/* Checkboxes de días */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia.value} className="flex flex-col items-center gap-2">
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={diasSeleccionados.includes(dia.value)}
                        onCheckedChange={() => toggleDia(dia.value)}
                        disabled={loading}
                      />
                      <span className="text-xs font-medium text-center">
                        {dia.label.substring(0, 3)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Hora de Inicio</FieldLabel>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel>Hora de Fin</FieldLabel>
                  <Input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    disabled={loading}
                  />
                </Field>
              </div>

              {/* Resumen visual */}
              {diasSeleccionados.length > 0 && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Horarios configurados:</p>
                  <p className="text-xs text-muted-foreground">
                    {diasSeleccionados
                      .map((dia) => DIAS_SEMANA.find((d) => d.value === dia)?.label)
                      .join(", ")}{" "}
                    de {horaInicio} a {horaFin}
                  </p>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("activo")}
                    disabled={loading}
                    className="size-4 rounded border border-input"
                  />
                  <FieldLabel>Espacio activo</FieldLabel>
                </div>
              </Field>

              <Field>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("requiereAprobacion")}
                    disabled={loading}
                    className="size-4 rounded border border-input"
                  />
                  <FieldLabel>Requiere aprobación</FieldLabel>
                </div>
              </Field>
            </div>
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
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

