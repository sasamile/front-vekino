"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { IconSparkles, IconArrowRight, IconX } from "@tabler/icons-react";
import type { Factura } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const pagoSchema = z.object({
  metodoPago: z.enum(["WOMPI", "EFECTIVO"]),
  observaciones: z.string().optional(),
});

type PagoFormData = z.infer<typeof pagoSchema>;

interface DialogPagoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura | null;
  pagoCreado: any;
  formatCurrency: (amount: number) => string;
  onSubmit: (data: { metodoPago: string; observaciones?: string }) => void;
  isPending: boolean;
}

export function DialogPago({
  open,
  onOpenChange,
  factura,
  pagoCreado,
  formatCurrency,
  onSubmit,
  isPending,
}: DialogPagoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      metodoPago: "WOMPI",
      observaciones: "",
    },
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Realizar Pago</DialogTitle>
          <DialogDescription>
            {factura && `Pagar la factura ${factura.numeroFactura}`}
          </DialogDescription>
        </DialogHeader>

        {pagoCreado && pagoCreado.paymentLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Redirigiendo a Wompi para completar el pago...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Si no eres redirigido automáticamente, haz clic en el botón de
                abajo.
              </p>
            </div>
            <Button
              onClick={() => {
                const link =
                  pagoCreado.paymentLink || pagoCreado.wompiPaymentLink;
                if (link) {
                  window.location.href = link;
                }
              }}
              className="w-full"
              size="lg"
            >
              Ir a Wompi para Pagar
              <IconArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        ) : factura ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Factura:
                </span>
                <span className="text-sm font-semibold">
                  {factura.numeroFactura}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Valor a pagar:
                </span>
                <span className="text-xl font-bold">
                  {formatCurrency(factura.valorConDescuento ?? factura.valor)}
                </span>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel>Método de Pago *</FieldLabel>
                <select
                  {...register("metodoPago")}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="WOMPI">
                    Wompi (Tarjeta, PSE, etc.) - Procesamiento automático
                  </option>
                  <option value="EFECTIVO">
                    Efectivo - Se marca como completado automáticamente
                  </option>
                </select>
                {errors.metodoPago && (
                  <FieldError>{errors.metodoPago.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Observaciones (opcional)</FieldLabel>
                <textarea
                  {...register("observaciones")}
                  placeholder="Observaciones adicionales del pago..."
                  disabled={isPending}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                <IconX className="size-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} size="lg">
                {isPending ? (
                  "Procesando..."
                ) : (
                  <>
                    <IconSparkles className="size-4 mr-2" />
                    Proceder al Pago
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

