"use client";

import { useState } from "react";
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
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { EspacioComunTipo, UnidadTiempo, CreateEspacioComunRequest, HorarioDisponibilidad } from "@/types/types";

const espacioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
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
  ], {
    message: "El tipo es requerido",
  }),
  capacidad: z.number().min(1, "La capacidad debe ser mayor a 0"),
  descripcion: z.string().optional(),
  unidadTiempo: z.enum(["HORAS", "DIAS", "MESES"], {
    message: "La unidad de tiempo es requerida",
  }),
  precioPorUnidad: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  activo: z.boolean(),
  requiereAprobacion: z.boolean(),
});

type EspacioFormData = z.infer<typeof espacioSchema>;

interface CreateEspacioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const UNIDAD_TIEMPO_OPTIONS: { value: UnidadTiempo; label: string }[] = [
  { value: "HORAS", label: "Horas" },
  { value: "DIAS", label: "Días" },
  { value: "MESES", label: "Meses" },
];

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function CreateEspacioDialog({
  open,
  onOpenChange,
}: CreateEspacioDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  
  // Estado para horarios
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5]); // Lunes a Viernes por defecto
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("22:00");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EspacioFormData>({
    resolver: zodResolver(espacioSchema),
    defaultValues: {
      nombre: "",
      tipo: "SALON_SOCIAL",
      capacidad: 1,
      descripcion: "",
      unidadTiempo: "HORAS",
      precioPorUnidad: 0,
      activo: true,
      requiereAprobacion: true,
    },
  });

  const requiereAprobacion = watch("requiereAprobacion");

  // Función para convertir horarios a JSON string
  const generarHorariosJSON = (): string => {
    const horarios: HorarioDisponibilidad[] = diasSeleccionados.map((dia) => ({
      dia,
      horaInicio,
      horaFin,
    }));
    return JSON.stringify(horarios);
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

  const onSubmit = async (data: EspacioFormData) => {
    // Validar que haya al menos un día seleccionado
    if (diasSeleccionados.length === 0) {
      toast.error("Debes seleccionar al menos un día de la semana", {
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const requestData: CreateEspacioComunRequest = {
        nombre: data.nombre,
        tipo: data.tipo,
        capacidad: data.capacidad,
        descripcion: data.descripcion || undefined,
        unidadTiempo: data.unidadTiempo,
        precioPorUnidad: data.precioPorUnidad,
        activo: data.activo,
        requiereAprobacion: data.requiereAprobacion,
        horariosDisponibilidad: generarHorariosJSON(),
      };

      await axiosInstance.post("/reservas/espacios", requestData);

      toast.success("Espacio común creado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["espacios-comunes"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el espacio común";

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
      setDiasSeleccionados([1, 2, 3, 4, 5]);
      setHoraInicio("09:00");
      setHoraFin("22:00");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Espacio Común</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo espacio común
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Nombre *</FieldLabel>
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
                <FieldLabel>Tipo *</FieldLabel>
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

            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Capacidad (personas) *</FieldLabel>
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
                <FieldLabel>Unidad de Tiempo *</FieldLabel>
                <select
                  {...register("unidadTiempo")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {UNIDAD_TIEMPO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.unidadTiempo && (
                  <FieldError>{errors.unidadTiempo.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Precio por Unidad *</FieldLabel>
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
              <FieldLabel>Horarios de Disponibilidad *</FieldLabel>
              
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
                  <FieldLabel>Hora de Inicio *</FieldLabel>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel>Hora de Fin *</FieldLabel>
                  <Input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    disabled={loading}
                  />
                </Field>
              </div>

              {diasSeleccionados.length === 0 && (
                <FieldError>Debes seleccionar al menos un día</FieldError>
              )}

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
              {loading ? "Creando..." : "Crear Espacio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

