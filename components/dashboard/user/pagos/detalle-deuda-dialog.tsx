"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeEstado } from "./badge-estado";
import type { Factura } from "@/types/types";
import type { MisPagosResponse } from "./types";
import { getValorFacturado, getSaldoPendiente } from "./utils";
import { IconArrowRight } from "@tabler/icons-react";

interface DetalleDeudaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  misPagos: MisPagosResponse | undefined;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  puedePagar: (factura: Factura) => boolean;
  handlePagar: (factura: Factura) => void;
  isPaying: boolean;
  onVerTodasLasFacturas?: () => void;
}

export function DetalleDeudaDialog({
  open,
  onOpenChange,
  misPagos,
  formatCurrency,
  formatDate,
  puedePagar,
  handlePagar,
  isPaying,
  onVerTodasLasFacturas,
}: DetalleDeudaDialogProps) {
  const vencidasCantidad = misPagos?.resumen?.vencidas?.cantidad || 0;

  const facturasConDeuda =
    misPagos?.facturas.filter(
      (f) =>
        f.estado !== "PAGADA" &&
        f.estado !== "CANCELADA"
    ) ?? [];

  const totalDeudaValor = facturasConDeuda.reduce(
    (s, f) => s + getSaldoPendiente(f),
    0
  );
  const totalDeudaCantidad = facturasConDeuda.filter(
    (f) => getSaldoPendiente(f) > 0
  ).length;

  const handleVerTodas = () => {
    onOpenChange(false);
    onVerTodasLasFacturas?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Detalle de tu deuda</DialogTitle>
          <DialogDescription>
            Resumen y facturas con saldo pendiente
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto min-h-0 space-y-4">
          {/* Resumen */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Total a pagar
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalDeudaValor)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {totalDeudaCantidad} factura{totalDeudaCantidad !== 1 ? "s" : ""}{" "}
              {vencidasCantidad > 0
                ? `(${vencidasCantidad} vencida${vencidasCantidad !== 1 ? "s" : ""})`
                : ""}
            </p>
          </div>

          {/* Lista de facturas con deuda */}
          {facturasConDeuda.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold mb-3">Facturas pendientes</h3>
              <ul className="space-y-3">
                {facturasConDeuda.map((factura) => {
                  const valorFacturado = getValorFacturado(factura);
                  const saldoPendiente = getSaldoPendiente(factura);
                  const monto = saldoPendiente > 0 ? saldoPendiente : valorFacturado;
                  const esAbonado =
                    factura.estado === "ABONADO" &&
                    saldoPendiente > 0 &&
                    valorFacturado > saldoPendiente;

                  return (
                    <li
                      key={factura.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border bg-background"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {factura.numeroFactura}
                          </span>
                          <BadgeEstado estado={factura.estado} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {factura.descripcion ||
                            `Cuota de administración ${factura.periodo}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {formatDate(factura.fechaVencimiento)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-sm">
                            {formatCurrency(monto)}
                          </span>
                          {esAbonado && (
                            <p className="text-xs text-muted-foreground">
                              de {formatCurrency(valorFacturado)}
                            </p>
                          )}
                        </div>
                        {puedePagar(factura) && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handlePagar(factura)}
                            disabled={isPaying}
                          >
                            {isPaying ? "..." : "Pagar"}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tienes facturas con saldo pendiente.
            </p>
          )}

          {onVerTodasLasFacturas && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleVerTodas}
            >
              Ver todas las facturas
              <IconArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
