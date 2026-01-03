"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reserva } from "@/types/types";
import {
  IconCalendar,
  IconUser,
  IconBuilding,
  IconCurrencyDollar,
  IconInfoCircle,
  IconFileText,
} from "@tabler/icons-react";

interface ViewReservaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserva: Reserva | null;
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  CONFIRMADA: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  COMPLETADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
};

export function ViewReservaDialog({
  open,
  onOpenChange,
  reserva,
}: ViewReservaDialogProps) {
  if (!reserva) return null;

  // Formatear fecha de UTC a hora local
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Información de la Reserva</DialogTitle>
          <DialogDescription>
            Detalles completos de la reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Estado
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                ESTADO_COLORS[reserva.estado] || ESTADO_COLORS.PENDIENTE
              }`}
            >
              {ESTADO_LABELS[reserva.estado] || reserva.estado}
            </span>
          </div>

          {/* Información del Espacio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconBuilding className="size-5" />
              Espacio Común
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nombre
                </label>
                <p className="text-sm font-medium mt-1">
                  {reserva.espacioComun?.nombre || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <p className="text-sm font-medium mt-1">
                  {reserva.espacioComun?.tipo || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconUser className="size-5" />
              Usuario
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nombre
                </label>
                <p className="text-sm font-medium mt-1">
                  {reserva.user?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm font-medium mt-1">
                  {reserva.user?.email || "N/A"}
                </p>
              </div>
              {reserva.unidad && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Unidad
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {reserva.unidad.identificador || "N/A"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fechas y Horarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconCalendar className="size-5" />
              Fechas y Horarios
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha de Inicio
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatDate(reserva.fechaInicio)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha de Fin
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatDate(reserva.fechaFin)}
                </p>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconInfoCircle className="size-5" />
              Información Adicional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {reserva.cantidadPersonas && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cantidad de Personas
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {reserva.cantidadPersonas}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Precio Total
                </label>
                <p className="text-sm font-medium mt-1">
                  ${reserva.precioTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo y Observaciones */}
          {(reserva.motivo || reserva.observaciones) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconFileText className="size-5" />
                Detalles
              </h3>
              {reserva.motivo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Motivo
                  </label>
                  <p className="text-sm mt-1">{reserva.motivo}</p>
                </div>
              )}
              {reserva.observaciones && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Observaciones
                  </label>
                  <p className="text-sm mt-1">{reserva.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

