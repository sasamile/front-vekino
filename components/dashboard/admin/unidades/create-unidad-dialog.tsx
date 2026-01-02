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
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { UnidadTipo, UnidadEstado, CreateUnidadRequest } from "@/types/types";

const unidadSchema = z.object({
  identificador: z.string().min(1, "El identificador es requerido"),
  tipo: z.enum(["APARTAMENTO", "CASA", "LOCAL_COMERCIAL"], {
    message: "El tipo es requerido",
  }),
  area: z.number().min(0.01, "El área debe ser mayor a 0"),
  coeficienteCopropiedad: z.number().min(0, "El coeficiente debe ser mayor o igual a 0"),
  valorCuotaAdministracion: z.number().min(0, "El valor de la cuota debe ser mayor o igual a 0"),
  estado: z.enum(["VACIA", "OCUPADA", "EN_MANTENIMIENTO"], {
    message: "El estado es requerido",
  }),
});

type UnidadFormData = z.infer<typeof unidadSchema>;

interface CreateUnidadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_OPTIONS: { value: UnidadTipo; label: string }[] = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial" },
];

const ESTADO_OPTIONS: { value: UnidadEstado; label: string }[] = [
  { value: "VACIA", label: "Vacía" },
  { value: "OCUPADA", label: "Ocupada" },
  { value: "EN_MANTENIMIENTO", label: "En Mantenimiento" },
];

export function CreateUnidadDialog({
  open,
  onOpenChange,
}: CreateUnidadDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
    defaultValues: {
      identificador: "",
      tipo: "APARTAMENTO",
      area: 0,
      coeficienteCopropiedad: 0,
      valorCuotaAdministracion: 0,
      estado: "VACIA",
    },
  });

  const onSubmit = async (data: UnidadFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const requestData: CreateUnidadRequest = {
        identificador: data.identificador,
        tipo: data.tipo,
        area: data.area,
        coeficienteCopropiedad: data.coeficienteCopropiedad,
        valorCuotaAdministracion: data.valorCuotaAdministracion,
        estado: data.estado,
      };

      await axiosInstance.post("/unidades", requestData);

      toast.success("Unidad creada exitosamente", {
        duration: 2000,
      });

      // Invalidar y revalidar las queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ["unidades"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear la unidad";

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
          <DialogTitle>Crear Nueva Unidad</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva unidad en el condominio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Identificador *</FieldLabel>
                <Input
                  {...register("identificador")}
                  placeholder="Ej: Apto 102"
                  disabled={loading}
                />
                {errors.identificador && (
                  <FieldError>{errors.identificador.message}</FieldError>
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

            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Área (m²) *</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register("area", { valueAsNumber: true })}
                  placeholder="Ej: 65.5"
                  disabled={loading}
                />
                {errors.area && (
                  <FieldError>{errors.area.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Coeficiente Copropiedad *</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register("coeficienteCopropiedad", { valueAsNumber: true })}
                  placeholder="Ej: 2.5"
                  disabled={loading}
                />
                {errors.coeficienteCopropiedad && (
                  <FieldError>{errors.coeficienteCopropiedad.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Valor Cuota Admin *</FieldLabel>
                <Input
                  type="number"
                  step="1000"
                  {...register("valorCuotaAdministracion", { valueAsNumber: true })}
                  placeholder="Ej: 150000"
                  disabled={loading}
                />
                {errors.valorCuotaAdministracion && (
                  <FieldError>{errors.valorCuotaAdministracion.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Estado *</FieldLabel>
              <select
                {...register("estado")}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ESTADO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <FieldError>{errors.estado.message}</FieldError>
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
              {loading ? "Creando..." : "Crear Unidad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

