"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MisPagosResponse } from "./types";

interface ResumenPagosProps {
  misPagos: MisPagosResponse | undefined;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
}

export function ResumenPagos({
  misPagos,
  isLoading,
  formatCurrency,
}: ResumenPagosProps) {
  const estaAlDia = misPagos?.resumen
    ? misPagos.resumen.vencidas.cantidad === 0 &&
      misPagos.resumen.pendientes.cantidad === 0
    : false;

  if (isLoading) {
    return (
      <div className="space-y-6 mb-10">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!misPagos) return null;

  return (
    <div className="space-y-6 mb-10">
      {/* Estado con Semáforo */}
      <div
        className={`p-4 sm:p-6 rounded-lg border-2 ${
          estaAlDia
            ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"
            : misPagos.resumen.vencidas.cantidad > 0
            ? "border-red-500/30 bg-red-50 dark:bg-red-950/20"
            : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Semáforo */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Verde - Al día */}
            <div
              className={`w-5 h-5 rounded-full transition-all ${
                estaAlDia
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 dark:ring-emerald-600"
                  : "bg-gray-300 dark:bg-gray-600 opacity-40"
              }`}
            />
            {/* Amarillo - Pendientes */}
            <div
              className={`w-5 h-5 rounded-full transition-all ${
                !estaAlDia && misPagos.resumen.vencidas.cantidad === 0
                  ? "bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300 dark:ring-amber-600"
                  : "bg-gray-300 dark:bg-gray-600 opacity-40"
              }`}
            />
            {/* Rojo - Vencidas */}
            <div
              className={`w-5 h-5 rounded-full transition-all ${
                misPagos.resumen.vencidas.cantidad > 0
                  ? "bg-red-500 shadow-lg shadow-red-500/50 ring-2 ring-red-300 dark:ring-red-600"
                  : "bg-gray-300 dark:bg-gray-600 opacity-40"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-bold text-lg sm:text-xl mb-1 ${
                estaAlDia
                  ? "text-emerald-700 dark:text-emerald-300"
                  : misPagos.resumen.vencidas.cantidad > 0
                  ? "text-red-700 dark:text-red-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {estaAlDia
                ? "Estás al día"
                : misPagos.resumen.vencidas.cantidad > 0
                ? "Tienes facturas vencidas"
                : "Tienes facturas pendientes"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {misPagos.resumen.vencidas.cantidad > 0
                ? `${misPagos.resumen.vencidas.cantidad} factura${
                    misPagos.resumen.vencidas.cantidad > 1 ? "s" : ""
                  } vencida${
                    misPagos.resumen.vencidas.cantidad > 1 ? "s" : ""
                  } por un total de ${formatCurrency(
                    misPagos.resumen.vencidas.valor
                  )}`
                : misPagos.resumen.pendientes.cantidad > 0
                ? `${misPagos.resumen.pendientes.cantidad} factura${
                    misPagos.resumen.pendientes.cantidad > 1 ? "s" : ""
                  } pendiente${
                    misPagos.resumen.pendientes.cantidad > 1 ? "s" : ""
                  } por un total de ${formatCurrency(
                    misPagos.resumen.pendientes.valor
                  )}`
                : "Todas tus facturas están pagadas"}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 border-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">
            Pendientes
          </p>
          <p className="text-2xl sm:text-3xl font-bold mb-1">
            {misPagos.resumen.pendientes.cantidad}
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(misPagos.resumen.pendientes.valor)}
          </p>
        </div>
        <div className="p-4 sm:p-5 border-2 rounded-lg bg-red-50/50 dark:bg-red-950/10">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">
            Vencidas
          </p>
          <p className="text-2xl sm:text-3xl font-bold mb-1">
            {misPagos.resumen.vencidas.cantidad}
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(misPagos.resumen.vencidas.valor)}
          </p>
        </div>
        <div className="p-4 sm:p-5 border-2 rounded-lg bg-green-50/50 dark:bg-green-950/10">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">
            Pagadas
          </p>
          <p className="text-2xl sm:text-3xl font-bold mb-1">
            {misPagos.resumen.pagadas.cantidad}
          </p>
          <p className="text-sm font-medium">
            {misPagos.resumen.pagadas.cantidad > 0
              ? "Completadas"
              : "Sin pagos"}
          </p>
        </div>
      </div>
    </div>
  );
}

