"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MisPagosResponse } from "./types";

interface ResumenPagosProps {
  misPagos: MisPagosResponse | undefined;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  onVerDetalle?: () => void;
  /** Si se pasa, se usa para mostrar deuda (valor con descuento − pagado). Si no, se usa resumen del API. */
  deudaDisplay?: { cantidad: number; valor: number };
}

export function ResumenPagos({
  misPagos,
  isLoading,
  formatCurrency,
  onVerDetalle,
  deudaDisplay,
}: ResumenPagosProps) {
  const estaAlDia = misPagos?.resumen
    ? misPagos.resumen.vencidas.cantidad === 0 &&
      misPagos.resumen.pendientes.cantidad === 0
    : false;

  if (isLoading) {
    return (
      <div className="h-full w-full min-h-[180px] rounded-xl border shadow-md p-5 sm:p-6 bg-linear-to-br from-amber-200/30 via-white to-white flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  const pendientesCantidad = misPagos?.resumen?.pendientes?.cantidad || 0;
  const vencidasCantidad = misPagos?.resumen?.vencidas?.cantidad || 0;
  const pendientesValor = misPagos?.resumen?.pendientes?.valor || 0;
  const vencidasValor = misPagos?.resumen?.vencidas?.valor || 0;

  const totalDeudaCantidad = deudaDisplay?.cantidad ?? (pendientesCantidad + vencidasCantidad);
  const totalDeudaValor = deudaDisplay?.valor ?? (pendientesValor + vencidasValor);

  return (
    <div className="h-full w-full min-h-[180px] rounded-xl border shadow-md p-5 sm:p-6 bg-linear-to-br from-amber-200/30 via-white to-white flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Estado Actual</span>
          <span
            className={`text-xs px-2 py-1 rounded-md ${
              estaAlDia
                ? "bg-emerald-100 text-emerald-700"
                : vencidasCantidad > 0
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {estaAlDia
              ? "Al día"
              : vencidasCantidad > 0
              ? "Vencida"
              : "Pendiente"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Deuda: {totalDeudaCantidad} factura{totalDeudaCantidad !== 1 ? "s" : ""} ({formatCurrency(totalDeudaValor)})
        </p>
      </div>
      <div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm transition-colors"
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
