"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MisPagosResponse } from "./types";

interface ResumenPagosProps {
  misPagos: MisPagosResponse | undefined;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  onVerDetalle?: () => void;
}

export function ResumenPagos({
  misPagos,
  isLoading,
  formatCurrency,
  onVerDetalle,
}: ResumenPagosProps) {
  const estaAlDia = misPagos?.resumen
    ? misPagos.resumen.vencidas.cantidad === 0 &&
      misPagos.resumen.pendientes.cantidad === 0
    : false;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!misPagos) return null;

  const totalDeudaCantidad =
    (misPagos.resumen.pendientes.cantidad || 0) +
    (misPagos.resumen.vencidas.cantidad || 0);
  const totalDeudaValor =
    (misPagos.resumen.pendientes.valor || 0) +
    (misPagos.resumen.vencidas.valor || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div className="h-full w-full min-h-[140px] rounded-xl border shadow-md p-5 sm:p-6 bg-linear-to-br from-amber-200/30 via-white to-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Estado Actual</span>
          <span
            className={`text-xs px-2 py-1 rounded-md ${
              estaAlDia
                ? "bg-emerald-100 text-emerald-700"
                : misPagos.resumen.vencidas.cantidad > 0
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {estaAlDia
              ? "Al día"
              : misPagos.resumen.vencidas.cantidad > 0
              ? "Vencida"
              : "Pendiente"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Deuda: {totalDeudaCantidad} factura{totalDeudaCantidad !== 1 ? "s" : ""} ({formatCurrency(totalDeudaValor)})
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm"
          onClick={() => {
            if (onVerDetalle) {
              onVerDetalle();
            }
          }}
        >
          Ver Detalle
        </button>
      </div>
    </div>
  );
}
