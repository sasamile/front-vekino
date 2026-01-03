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
import type { CreateFacturasBulkRequest } from "@/types/types";

const facturasBulkSchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "El período debe tener el formato YYYY-MM"),
  fechaEmision: z.string().min(1, "La fecha de emisión es requerida"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  enviarFacturas: z.boolean().default(false),
});

type FacturasBulkFormData = z.input<typeof facturasBulkSchema>;

interface CreateFacturasBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFacturasBulkDialog({
  open,
  onOpenChange,
}: CreateFacturasBulkDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FacturasBulkFormData>({
    resolver: zodResolver(facturasBulkSchema),
    defaultValues: {
      periodo: "",
      fechaEmision: "",
      fechaVencimiento: "",
      enviarFacturas: false,
    },
  });

  const onSubmit = async (data: FacturasBulkFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      // Convertir fechas a ISO string con timezone offset
      const convertirFechaLocal = (fechaLocal: string, esInicioDia: boolean = false): string => {
        if (!fechaLocal) return "";
        
        if (fechaLocal.includes('Z') || fechaLocal.match(/[+-]\d{2}:\d{2}/)) {
          return fechaLocal;
        }
        
        if (fechaLocal.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const offsetMinutes = new Date().getTimezoneOffset();
          const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
          const offsetMins = Math.abs(offsetMinutes) % 60;
          const offsetSign = offsetMinutes >= 0 ? '-' : '+';
          const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
          // Para fechaEmision usar inicio del día (00:00:00), para fechaVencimiento usar fin del día (23:59:59)
          const hora = esInicioDia ? "00:00:00" : "23:59:59";
          return `${fechaLocal}T${hora}${offsetString}`;
        }
        
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
      
      const fechaEmisionISO = convertirFechaLocal(data.fechaEmision, true);
      const fechaVencimientoISO = convertirFechaLocal(data.fechaVencimiento, false);
      
      const requestData: CreateFacturasBulkRequest = {
        periodo: data.periodo,
        fechaEmision: fechaEmisionISO,
        fechaVencimiento: fechaVencimientoISO,
        enviarFacturas: data.enviarFacturas,
      };

      const response = await axiosInstance.post("/finanzas/facturas/bulk", requestData);

      toast.success(`Se crearon ${response.data.total || 0} facturas exitosamente`, {
        duration: 3000,
      });

      await queryClient.invalidateQueries({ queryKey: ["facturas"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear las facturas";

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Facturas Masivas</DialogTitle>
          <DialogDescription>
            Crea facturas para todas las unidades activas usando su valor de cuota de administración asignado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Fecha de Emisión *</FieldLabel>
                <Input
                  type="date"
                  {...register("fechaEmision")}
                  disabled={loading}
                />
                {errors.fechaEmision && (
                  <FieldError>{errors.fechaEmision.message}</FieldError>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha en que se emite/envía la factura
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha límite de pago
                </p>
              </Field>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Información importante:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Se crearán facturas para todas las unidades activas que tengan un valor de cuota de administración asignado</li>
                <li>El valor de cada factura se tomará automáticamente del campo "valorCuotaAdministracion" de cada unidad</li>
                <li>Las facturas se asignarán automáticamente al propietario o arrendatario de cada unidad</li>
                <li>No se pueden crear facturas duplicadas para el mismo período</li>
              </ul>
            </div>

            <Field>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("enviarFacturas")}
                  disabled={loading}
                  className="size-4 rounded border-input"
                />
                <FieldLabel className="mb-0!">
                  Enviar facturas automáticamente (cambiará el estado a ENVIADA y enviará notificación)
                </FieldLabel>
              </div>
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
              {loading ? "Creando..." : "Crear Facturas Masivas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

