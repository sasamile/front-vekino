"use client";

import { useState } from "react";
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
import type { CreateFacturaRequest, Unidad } from "@/types/types";

const facturaSchema = z.object({
  unidadId: z.string().min(1, "La unidad es requerida"),
  userId: z.string().optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "El período debe tener el formato YYYY-MM"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  valor: z.number().min(0.01, "El valor debe ser mayor a 0"),
  descripcion: z.string().optional(),
  observaciones: z.string().optional(),
});

type FacturaFormData = z.infer<typeof facturaSchema>;

interface CreateFacturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFacturaDialog({
  open,
  onOpenChange,
}: CreateFacturaDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  // Obtener unidades
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
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
  } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      unidadId: "",
      userId: "",
      periodo: "",
      fechaVencimiento: "",
      valor: 0,
      descripcion: "",
      observaciones: "",
    },
  });

  const unidadId = watch("unidadId");

  // Obtener usuarios de la unidad seleccionada
  const { data: unidadConUsuarios } = useQuery({
    queryKey: ["unidad-usuarios", unidadId],
    queryFn: async () => {
      if (!unidadId) return null;
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(`/unidades/${unidadId}`);
      return response.data;
    },
    enabled: !!unidadId && open,
  });

  const onSubmit = async (data: FacturaFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      // Convertir fecha de vencimiento a ISO string con timezone offset
      const convertirFechaLocal = (fechaLocal: string): string => {
        if (!fechaLocal) return "";
        
        if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
          return fechaLocal;
        }
        
        // Si es solo fecha (YYYY-MM-DD), agregar hora de fin de día con timezone
        if (fechaLocal.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const offsetMinutes = new Date().getTimezoneOffset();
          const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
          const offsetMins = Math.abs(offsetMinutes) % 60;
          const offsetSign = offsetMinutes >= 0 ? '-' : '+';
          const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
          return `${fechaLocal}T23:59:59${offsetString}`;
        }
        
        // Si es datetime-local
        if (fechaLocal.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          const offsetMinutes = new Date().getTimezoneOffset();
          const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
          const offsetMins = Math.abs(offsetMinutes) % 60;
          const offsetSign = offsetMinutes >= 0 ? '-' : '+';
          const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
          return fechaLocal + `:00${offsetString}`;
        }
        
        return fechaLocal;
      };
      
      const fechaVencimientoISO = convertirFechaLocal(data.fechaVencimiento);
      
      const requestData: CreateFacturaRequest = {
        unidadId: data.unidadId,
        userId: data.userId || undefined,
        periodo: data.periodo,
        fechaVencimiento: fechaVencimientoISO,
        valor: data.valor,
        descripcion: data.descripcion || undefined,
        observaciones: data.observaciones || undefined,
      };

      await axiosInstance.post("/finanzas/facturas", requestData);

      toast.success("Factura creada exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["facturas"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear la factura";

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
          <DialogTitle>Crear Nueva Factura</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva factura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Unidad *</FieldLabel>
              <select
                {...register("unidadId")}
                disabled={loading || unidades.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {unidades.length === 0 ? "Cargando unidades..." : "Selecciona una unidad"}
                </option>
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.identificador} - {unidad.tipo}
                  </option>
                ))}
              </select>
              {errors.unidadId && (
                <FieldError>{errors.unidadId.message}</FieldError>
              )}
            </Field>

            {unidadId && unidadConUsuarios?.usuarios && unidadConUsuarios.usuarios.length > 0 && (
              <Field>
                <FieldLabel>Usuario Responsable (Opcional)</FieldLabel>
                <select
                  {...register("userId")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Usuario por defecto de la unidad</option>
                  {unidadConUsuarios.usuarios.map((usuario: any) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.name} - {usuario.email}
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <FieldError>{errors.userId.message}</FieldError>
                )}
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Período * (YYYY-MM)</FieldLabel>
                <Input
                  type="month"
                  {...register("periodo")}
                  disabled={loading}
                />
                {errors.periodo && (
                  <FieldError>{errors.periodo.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Fecha de Vencimiento *</FieldLabel>
                <Input
                  type="date"
                  {...register("fechaVencimiento")}
                  disabled={loading}
                />
                {errors.fechaVencimiento && (
                  <FieldError>{errors.fechaVencimiento.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Valor *</FieldLabel>
              <Input
                type="number"
                step="0.01"
                {...register("valor", { valueAsNumber: true })}
                disabled={loading}
                placeholder="0.00"
              />
              {errors.valor && (
                <FieldError>{errors.valor.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <Input
                {...register("descripcion")}
                placeholder="Ej: Cuota de administración enero 2026"
                disabled={loading}
              />
              {errors.descripcion && (
                <FieldError>{errors.descripcion.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Observaciones</FieldLabel>
              <textarea
                {...register("observaciones")}
                placeholder="Observaciones adicionales..."
                disabled={loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.observaciones && (
                <FieldError>{errors.observaciones.message}</FieldError>
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
              {loading ? "Creando..." : "Crear Factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


