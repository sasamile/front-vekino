"use client";

import { useState, useEffect } from "react";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { CreatePagoRequest, MetodoPago, Factura } from "@/types/types";

const pagoSchema = z.object({
  metodoPago: z.enum(["WOMPI", "EFECTIVO"]).default("WOMPI"),
  observaciones: z.string().optional(),
});

type PagoFormData = z.input<typeof pagoSchema>;

interface CreatePagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura | null;
  isAdmin?: boolean; // Si es true, solo permite pagos en efectivo
}

const METODO_PAGO_OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: "WOMPI", label: "Wompi (Tarjeta, PSE, etc.) - Procesamiento automático" },
  { value: "EFECTIVO", label: "Efectivo - Se marca como completado automáticamente" },
];

const METODO_PAGO_OPTIONS_ADMIN: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo - Registrar pago recibido" },
];

export function CreatePagoDialog({
  open,
  onOpenChange,
  factura,
  isAdmin = false,
}: CreatePagoDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const [pagoCreado, setPagoCreado] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      metodoPago: isAdmin ? "EFECTIVO" : "WOMPI",
      observaciones: "",
    },
  });

  // Si es admin, solo permitir efectivo
  const metodoPagoOptions = isAdmin ? METODO_PAGO_OPTIONS_ADMIN : METODO_PAGO_OPTIONS;

  useEffect(() => {
    if (!open) {
      setPagoCreado(null);
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: PagoFormData) => {
    if (!factura) return;

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      // Construir URL con redirectUrl solo para Wompi
      // Incluir el subdomain completo si existe (ej: condominio-las-flores-actualizado.localhost:3000)
      let redirectUrl = `${window.location.origin}/pago-exitoso`;
      
      // Si estamos en localhost y hay subdomain, asegurar que la URL incluya el subdomain
      if (typeof window !== 'undefined' && window.location.hostname.includes('localhost') && subdomain) {
        const port = window.location.port ? `:${window.location.port}` : '';
        redirectUrl = `${window.location.protocol}//${subdomain}.localhost${port}/pago-exitoso`;
      }
      
      const endpoint = data.metodoPago === "WOMPI" 
        ? `/finanzas/pagos?redirectUrl=${encodeURIComponent(redirectUrl)}`
        : `/finanzas/pagos`;
      
      const requestData: CreatePagoRequest = {
        facturaId: factura.id,
        metodoPago: data.metodoPago,
        observaciones: data.observaciones || undefined,
      };

      const response = await axiosInstance.post(endpoint, requestData);
      const pago = response.data;

      // Si es Wompi, guardar el pago y mostrar el link para redirigir
      // Usar paymentLink si está disponible, sino usar wompiPaymentLink
      const paymentLink = pago.paymentLink || pago.wompiPaymentLink;
      if (data.metodoPago === "WOMPI" && paymentLink) {
        setPagoCreado({ ...pago, paymentLink });
        toast.success("Pago creado exitosamente. Redirigiendo a Wompi...", {
          duration: 2000,
        });
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = paymentLink;
        }, 1500);
      } else if (data.metodoPago === "EFECTIVO") {
        // Para efectivo, el pago se marca automáticamente como APROBADO
        toast.success("Pago en efectivo registrado exitosamente. La factura ha sido marcada como pagada.", {
          duration: 3000,
        });
        await queryClient.invalidateQueries({ queryKey: ["facturas"] });
        await queryClient.invalidateQueries({ queryKey: ["pagos"] });
        reset();
        onOpenChange(false);
      } else {
        toast.success("Pago creado exitosamente", {
          duration: 2000,
        });
        await queryClient.invalidateQueries({ queryKey: ["facturas"] });
        await queryClient.invalidateQueries({ queryKey: ["pagos"] });
        reset();
        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el pago";

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
      setPagoCreado(null);
      onOpenChange(false);
    }
  };

  if (!factura) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAdmin ? "Registrar Pago" : "Crear Pago"}</DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? `Registrar un pago en efectivo recibido para la factura ${factura.numeroFactura}`
              : `Crear un pago para la factura ${factura.numeroFactura}`
            }
          </DialogDescription>
        </DialogHeader>

        {pagoCreado && pagoCreado.paymentLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Redirigiendo a Wompi para completar el pago...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Si no eres redirigido automáticamente, haz clic en el botón de abajo.
              </p>
            </div>
            <Button
              onClick={() => {
                const link = pagoCreado.paymentLink || pagoCreado.wompiPaymentLink;
                if (link) {
                  window.location.href = link;
                }
              }}
              className="w-full"
            >
              Ir a Wompi para Pagar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Factura:
                  </span>
                  <span className="text-sm font-semibold">
                    {factura.numeroFactura}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Valor:
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(factura.valor)}
                  </span>
                </div>
              </div>

              <Field>
                <FieldLabel>Método de Pago *</FieldLabel>
                <select
                  {...register("metodoPago")}
                  disabled={loading || isAdmin}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {metodoPagoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.metodoPago && (
                  <FieldError>{errors.metodoPago.message}</FieldError>
                )}
                {isAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Como administrador, solo puedes registrar pagos en efectivo recibidos.
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel>Observaciones</FieldLabel>
                <textarea
                  {...register("observaciones")}
                  placeholder="Observaciones adicionales del pago..."
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
                {loading ? (isAdmin ? "Registrando..." : "Creando...") : (isAdmin ? "Registrar Pago" : "Crear Pago")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

