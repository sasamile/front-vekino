"use client";

import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import { BadgeEstado } from "./badge-estado";
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
}: ProximoPagoProps) {
  if (!proximoPago && !(estaAlDia && proximoPeriodoInfo)) {
    return null;
  }

  return (
    <div className="p-5 sm:p-6 rounded-xl border shadow-md bg-linear-to-br from-red-200/30 via-white to-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-base sm:text-lg font-semibold">
              Factura Pendiente
            </span>
            {proximoPago && <BadgeEstado estado={proximoPago.estado} />}
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
                {proximoPago.estado === "VENCIDA" ? "Vencido" : "Vence"}: {formatDate(proximoPago.fechaVencimiento)}
              </p>
              {proximoPago.estado === "PAGADA" && proximoPago.fechaPago && (
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
          ) : null}
        </div>
        <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
          {proximoPago ? (
            <>
              <p className="text-xl sm:text-2xl font-bold mb-3">
                {formatCurrency(proximoPago.valor)}
              </p>
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
                      Pagar ahora
                      <IconArrowRight className="size-4 ml-2" />
                    </>
                    )}
                  </Button>
                ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pendiente de generación
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
