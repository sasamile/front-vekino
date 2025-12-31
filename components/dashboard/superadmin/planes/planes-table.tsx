"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconCheck,
  IconX,
  IconEye,
  IconEdit,
  IconTrash,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import type { PlanPricing } from "@/types/types";

interface PlanPricingTableProps {
  plans: PlanPricing[];
  isLoading: boolean;
  error: Error | null;
  onView: (plan: PlanPricing) => void;
  onEdit: (plan: PlanPricing) => void;
  onDelete: (plan: PlanPricing) => void;
}

export function PlanPricingTable({
  plans,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
}: PlanPricingTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Precios de Planes</CardTitle>
            <CardDescription className="py-2">
              Gestiona los precios y configuraciones de los planes de suscripción
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los precios de planes. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Plan</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Precio Mensual
                  </th>
                  <th className="text-left p-4 text-sm font-medium">
                    Precio Anual
                  </th>
                  <th className="text-left p-4 text-sm font-medium">
                    Características
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconCurrencyDollar className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay precios de planes configurados. Crea uno para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Plan</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Precio Mensual
                  </th>
                  <th className="text-left p-4 text-sm font-medium">
                    Precio Anual
                  </th>
                  <th className="text-left p-4 text-sm font-medium">
                    Características
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{plan.plan}</span>
                        {plan.description && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {plan.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">
                        {formatCurrency(plan.monthlyPrice)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">
                        {plan.yearlyPrice
                          ? formatCurrency(plan.yearlyPrice)
                          : "N/A"}
                      </span>
                      {plan.yearlyPrice && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          Ahorro:{" "}
                          {formatCurrency(
                            plan.monthlyPrice * 12 - plan.yearlyPrice
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {plan.features && plan.features.length > 0 ? (
                          plan.features.slice(0, 3).map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                            >
                              {feature}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin características
                          </span>
                        )}
                        {plan.features && plan.features.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} más
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
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
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => onView(plan)}
                        >
                          <IconEye className="size-4" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => onEdit(plan)}
                        >
                          <IconEdit className="size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => onDelete(plan)}
                        >
                          <IconTrash className="size-4" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

