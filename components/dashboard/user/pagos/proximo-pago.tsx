"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowRight } from "@tabler/icons-react";
import { BadgeEstado } from "./badge-estado";
import { getValorFacturado, getSaldoPendiente, getEstadoVisual } from "./utils";
import type { Factura, FacturaEstado } from "@/types/types";

interface ProximoPagoProps {
  proximoPago: Factura | null;
  proximoPeriodoInfo: {
    periodo: string;
    fecha: Date;
    periodoFormateado: string;
  } | null;
  estaAlDia: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  puedePagar: (factura: Factura) => boolean;
  handlePagar: (factura: Factura) => void;
  isPaying: boolean;
  isLoading?: boolean;
}

export function ProximoPago({
  proximoPago,
  proximoPeriodoInfo,
  estaAlDia,
  formatCurrency,
  formatDate,
  puedePagar,
  handlePagar,
  isPaying,
  isLoading = false,
}: ProximoPagoProps) {
  if (isLoading) {
    return (
      <div className="h-full w-full min-h-[180px] p-5 sm:p-6 rounded-xl border shadow-md bg-linear-to-br from-red-200/30 via-white to-white flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-left sm:text-right shrink-0 w-full sm:w-auto space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full sm:w-36 rounded-md" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full min-h-[180px] p-5 sm:p-6 rounded-xl border shadow-md bg-linear-to-br from-red-200/30 via-white to-white flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-base sm:text-lg font-semibold">
              Factura Pendiente
            </span>
            {proximoPago ? (
              <BadgeEstado estado={getEstadoVisual(proximoPago) as FacturaEstado} />
            ) : (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                AL DÍA
              </span>
            )}
          </div>
          {proximoPago ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {proximoPago.descripcion ||
                  `Cuota de administración ${proximoPago.periodo}`}
              </p>
              <p className="text-sm font-medium mb-1">
                Factura: {proximoPago.numeroFactura}
              </p>
              <p className="text-xs text-muted-foreground">
                {getEstadoVisual(proximoPago) === "VENCIDA" ? "Vencido" : "Vence"}: {formatDate(proximoPago.fechaVencimiento)}
              </p>
              {getEstadoVisual(proximoPago) === "PAGADA" && proximoPago.fechaPago && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pagada el {formatDate(proximoPago.fechaPago)}
                  </p>
                  {proximoPeriodoInfo && (
                    <p className="text-xs font-medium mt-2">
                      Próximo período: {proximoPeriodoInfo.periodoFormateado}
                    </p>
                  )}
                </>
              )}
            </>
          ) : proximoPeriodoInfo ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Próxima cuota de administración
              </p>
              <p className="text-sm font-medium mb-1">
                Período: {proximoPeriodoInfo.periodoFormateado}
              </p>
              <p className="text-xs text-muted-foreground">
                La factura se generará próximamente
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Estado de cuenta
              </p>
              <p className="text-sm font-medium mb-1">
                No hay facturas pendientes
              </p>
              <p className="text-xs text-muted-foreground">
                Estás al día con tus pagos
              </p>
            </>
          )}
        </div>
        <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
          {proximoPago ? (
            <>
              <div className="mb-3">
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(
                    (() => {
                      const saldo = getSaldoPendiente(proximoPago);
                      const valorF = getValorFacturado(proximoPago);
                      return saldo > 0 ? saldo : valorF;
                    })()
                  )}
                </p>
                {(() => {
                  const saldo = getSaldoPendiente(proximoPago);
                  const valorF = getValorFacturado(proximoPago);
                  return saldo > 0 && valorF > saldo ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Saldo de {formatCurrency(valorF)} facturado
                    </p>
                  ) : null;
                })()}
              </div>
              {puedePagar(proximoPago) ? (
                <Button
                  onClick={() => handlePagar(proximoPago)}
                  disabled={isPaying}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  {isPaying ? (
                    "Procesando..."
                  ) : (
                    <>
                      Pagar Ahora
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-xl sm:text-2xl font-bold mb-3 text-emerald-600">
              {formatCurrency(0)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
