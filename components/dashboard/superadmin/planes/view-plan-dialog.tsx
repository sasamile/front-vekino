"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { PlanPricing } from "@/types/types";

interface ViewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanPricing | null;
}

export function ViewPlanDialog({
  open,
  onOpenChange,
  plan,
}: ViewPlanDialogProps) {
  if (!plan) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateYearlySavings = () => {
    if (!plan.yearlyPrice) return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  const savings = calculateYearlySavings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Plan: {plan.plan}</DialogTitle>
          <DialogDescription>
            Información completa del precio y configuración del plan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Estado y Plan */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-2xl font-bold">{plan.plan}</h3>
              {plan.description && (
                <p className="text-muted-foreground mt-1">{plan.description}</p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                plan.isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {plan.isActive ? (
                <IconCheck className="size-3.5" />
              ) : (
                <IconX className="size-3.5" />
              )}
              {plan.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Precio Mensual
              </Label>
              <p className="text-lg font-bold mt-1">
                {formatCurrency(plan.monthlyPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Facturación mensual
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Precio Anual
              </Label>
              <p className="text-lg font-bold mt-1">
                {plan.yearlyPrice ? (
                  formatCurrency(plan.yearlyPrice)
                ) : (
                  <span className="text-muted-foreground">No configurado</span>
                )}
              </p>
              {plan.yearlyPrice && savings !== null && savings > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Ahorro: {formatCurrency(savings)} al año
                </p>
              )}
            </div>
          </div>

          {/* Características */}
          {plan.features && plan.features.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Características Incluidas
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {plan.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">
                Fecha de Creación
              </Label>
              <p className="text-sm font-medium mt-1">
                {new Date(plan.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Última Actualización
              </Label>
              <p className="text-sm font-medium mt-1">
                {new Date(plan.updatedAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Nota sobre MRR */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Nota:</strong> Este precio se utiliza automáticamente
              para calcular el MRR (Monthly Recurring Revenue) en las métricas
              del dashboard. Solo los planes activos se consideran en los
              cálculos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

