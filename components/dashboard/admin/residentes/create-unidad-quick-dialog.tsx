"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import type { UnidadTipo, UnidadEstado } from "@/types/types";

const unidadQuickSchema = z.object({
  identificador: z.string().min(1, "El identificador es requerido"),
  tipo: z.enum(["APARTAMENTO", "CASA", "LOCAL_COMERCIAL"], {
    message: "El tipo es requerido",
  }),
  area: z.number().min(0.01, "El área debe ser mayor a 0"),
  valorCuotaAdministracion: z.number().min(0, "El valor de la cuota debe ser mayor o igual a 0"),
});

type UnidadQuickFormData = z.infer<typeof unidadQuickSchema>;

interface CreateUnidadQuickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    identificador: string;
    tipo: UnidadTipo;
    area: number;
    coeficienteCopropiedad: number;
    valorCuotaAdministracion: number;
    estado: UnidadEstado;
  }) => Promise<void>;
  loading?: boolean;
}

const TIPO_OPTIONS: { value: UnidadTipo; label: string }[] = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial" },
];

export function CreateUnidadQuickDialog({
  open,
  onOpenChange,
  onCreate,
  loading = false,
}: CreateUnidadQuickDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UnidadQuickFormData>({
    resolver: zodResolver(unidadQuickSchema),
    defaultValues: {
      identificador: "",
      tipo: "APARTAMENTO",
      area: 0,
      valorCuotaAdministracion: 0,
    },
  });

  const onSubmit = async (data: UnidadQuickFormData) => {
    await onCreate({
      identificador: data.identificador,
      tipo: data.tipo,
      area: data.area,
      coeficienteCopropiedad: 0,
      valorCuotaAdministracion: data.valorCuotaAdministracion,
      estado: "VACIA",
    });
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Unidad Rápida</DialogTitle>
          <DialogDescription>
            Crea una nueva unidad con información básica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
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

            <div className="grid grid-cols-2 gap-4">
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

