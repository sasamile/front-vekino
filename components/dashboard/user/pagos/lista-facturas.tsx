"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCheck } from "@tabler/icons-react";
import { BadgeEstado } from "./badge-estado";
import { getValorFacturado, getSaldoPendiente } from "./utils";
import type { Factura, FacturaEstado } from "@/types/types";

interface ListaFacturasProps {
  facturas: Factura[];
  total: number;
  isLoading: boolean;
  page: number;
  limit: number;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  puedePagar: (factura: Factura) => boolean;
  handlePagar: (factura: Factura) => void;
  isPaying: boolean;
  onPageChange: (page: number) => void;
}

export function ListaFacturas({
  facturas,
  total,
  isLoading,
  page,
  limit,
  formatCurrency,
  formatDate,
  puedePagar,
  handlePagar,
  isPaying,
  onPageChange,
}: ListaFacturasProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border gap-4"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex items-center gap-4 flex-wrap">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (facturas.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No hay facturas disponibles</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {facturas.map((factura) => {
          const isPagada = factura.estado === "PAGADA";
          const valorFacturado = getValorFacturado(factura);
          const saldoPendiente = getSaldoPendiente(factura);
          const montoAPagar = saldoPendiente > 0 ? saldoPendiente : valorFacturado;
          const esAbonado =
            factura.estado === "ABONADO" &&
            saldoPendiente > 0 &&
            valorFacturado > saldoPendiente;

          return (
            <div
              key={factura.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-semibold text-base">
                    {factura.numeroFactura}
                  </span>
                  <BadgeEstado estado={factura.estado} />
                  {isPagada && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconCheck className="size-4" />
                      <span className="text-xs font-medium">Pagada</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {factura.descripcion ||
                    `Cuota de administración ${factura.periodo}`}
                </p>
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <span className="font-medium text-muted-foreground">
                    Vence: {formatDate(factura.fechaVencimiento)}
                  </span>
                  {factura.fechaPago && (
                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <IconCheck className="size-3" />
                      Pagado: {formatDate(factura.fechaPago)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-lg font-bold">
                    {formatCurrency(montoAPagar)}
                  </span>
                  {esAbonado && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      saldo de {formatCurrency(valorFacturado)}
                    </p>
                  )}
                </div>
                {!isPagada && puedePagar(factura) ? (
                  <Button
                    onClick={() => handlePagar(factura)}
                    size="sm"
                    variant="default"
                    disabled={isPaying}
                    className="shrink-0 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isPaying ? "Procesando..." : "Pagar"}
                  </Button>
                ) : null}
                <a
                  href={`/api/finanzas/mis-facturas/${factura.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Descargar
                </a>
              </div>
            </div>
          );
        })}
      </div>
      {facturas.length >= limit && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-full sm:w-auto"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} • {facturas.length} de {total}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={facturas.length < limit}
            className="w-full sm:w-auto"
          >
            Siguiente
          </Button>
        </div>
      )}
    </>
  );
}
