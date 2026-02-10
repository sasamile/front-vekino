"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Factura } from "@/types/types";
import {
  IconUser,
  IconBuilding,
  IconCurrencyDollar,
  IconCalendar,
  IconFileText,
  IconFileDownload,
  IconAlertCircle,
} from "@tabler/icons-react";

interface ViewFacturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: Factura | null;
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  PAGADA: "Pagada",
  ABONADO: "Abonado",
  VENCIDA: "Vencida",
  CANCELADA: "Cancelada",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  ENVIADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  PAGADA: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  ABONADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  VENCIDA: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  CANCELADA: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

export function ViewFacturaDialog({
  open,
  onOpenChange,
  factura,
}: ViewFacturaDialogProps) {
  if (!factura) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Información de la Factura</DialogTitle>
          <DialogDescription>
            Detalles completos de la factura
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto overscroll-contain min-h-0 space-y-6">
          {/* Estado, Número de Factura y Vencida */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Número de Factura
              </span>
              <p className="text-lg font-semibold mt-1">
                {factura.numeroFactura}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {factura.estaVencida && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <IconAlertCircle className="size-3.5" />
                  Vencida
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  ESTADO_COLORS[factura.estado] || ESTADO_COLORS.PENDIENTE
                }`}
              >
                {ESTADO_LABELS[factura.estado] || factura.estado}
              </span>
            </div>
          </div>

          {/* Información de la Unidad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconBuilding className="size-5" />
              Unidad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Identificador
                </label>
                <p className="text-sm font-medium mt-1">
                  {factura.unidad?.identificador || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <p className="text-sm font-medium mt-1">
                  {factura.unidad?.tipo || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconUser className="size-5" />
              Usuario Responsable
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nombre
                </label>
                <p className="text-sm font-medium mt-1">
                  {factura.user?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm font-medium mt-1">
                  {factura.user?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconCurrencyDollar className="size-5" />
              Información Financiera
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Período
                </label>
                <p className="text-sm font-medium mt-1">
                  {factura.periodo}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Valor facturado
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatCurrency(factura.valorConDescuento ?? factura.valor)}
                </p>
              </div>
              {factura.valorVigente != null && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Valor vigente
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(factura.valorVigente)}
                  </p>
                </div>
              )}
              {factura.totalPagado != null && factura.totalPagado > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total pagado
                  </label>
                  <p className="text-sm font-medium mt-1 text-green-600 dark:text-green-400">
                    {formatCurrency(factura.totalPagado)}
                  </p>
                </div>
              )}
              {(() => {
                const valorF = factura.valorConDescuento ?? factura.valor;
                const saldoPendiente =
                  factura.totalPagado != null
                    ? Math.max(0, valorF - factura.totalPagado)
                    : (factura.saldoPendiente ?? 0);
                return saldoPendiente > 0 ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Saldo pendiente
                    </label>
                    <p className="text-sm font-medium mt-1 text-amber-600 dark:text-amber-400">
                      {formatCurrency(saldoPendiente)}
                    </p>
                  </div>
                ) : null;
              })()}
              {factura.saldoAnterior != null && factura.saldoAnterior > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Saldo anterior
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(factura.saldoAnterior)}
                  </p>
                </div>
              )}
              {factura.valorConDescuento != null && factura.valorConDescuento !== factura.valor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Valor sin descuento
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(factura.valor)}
                  </p>
                </div>
              )}
            </div>
            {(factura.fechaInicioDescuento || factura.fechaFinDescuento) && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                {factura.fechaInicioDescuento && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Inicio descuento
                    </label>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(factura.fechaInicioDescuento)}
                    </p>
                  </div>
                )}
                {factura.fechaFinDescuento && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Fin descuento
                    </label>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(factura.fechaFinDescuento)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PDF */}
          {factura.pdfUrl && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconFileDownload className="size-5" />
                Documento
              </h3>
              <a
                href={factura.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <IconFileDownload className="size-4" />
                Descargar PDF de la factura
              </a>
            </div>
          )}

          {/* Fechas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconCalendar className="size-5" />
              Fechas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha de Emisión
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatDate(factura.fechaEmision)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha de Vencimiento
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatDate(factura.fechaVencimiento)}
                </p>
              </div>
              {factura.fechaEnvio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fecha de Envío
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(factura.fechaEnvio)}
                  </p>
                </div>
              )}
              {factura.fechaPago && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fecha de Pago
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(factura.fechaPago)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Descripción y Observaciones */}
          {(factura.descripcion || factura.observaciones) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconFileText className="size-5" />
                Detalles
              </h3>
              {factura.descripcion && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Descripción
                  </label>
                  <p className="text-sm mt-1">{factura.descripcion}</p>
                </div>
              )}
              {factura.observaciones && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Observaciones
                  </label>
                  <p className="text-sm mt-1">{factura.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


