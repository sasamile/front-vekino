"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import type { Reserva, ReservaEstado } from "@/types/types";
import { formatDate, formatCurrency } from "./utils";

interface HistorialReservasProps {
  reservas: Reserva[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  getEstadoBadge: (estado: ReservaEstado) => React.ReactNode;
}

export function HistorialReservas({
  reservas,
  total,
  totalPages,
  isLoading,
  page,
  onPageChange,
  getEstadoBadge,
}: HistorialReservasProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reservas</CardTitle>
          <CardDescription>Cargando reservas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reservas</CardTitle>
          <CardDescription>Total: {total} reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No tienes reservas aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Reservas</CardTitle>
        <CardDescription>
          Total: {total} reservas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Vista de tabla para desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Espacio
                </th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Fecha Inicio
                </th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Fecha Fin
                </th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Estado
                </th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Motivo
                </th>
                <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                  Personas
                </th>
                <th className="text-right p-3 text-sm font-semibold text-muted-foreground">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva) => (
                <tr
                  key={reserva.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <IconMapPin className="size-4 text-muted-foreground" />
                      <span className="font-medium">
                        {reserva.espacioComun?.nombre || "Espacio"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDate(reserva.fechaInicio)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDate(reserva.fechaFin)}
                  </td>
                  <td className="p-3">
                    {getEstadoBadge(reserva.estado)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {reserva.motivo || "-"}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {reserva.cantidadPersonas ? (
                      <div className="flex items-center gap-1">
                        <IconUsers className="size-3" />
                        {reserva.cantidadPersonas}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(reserva.precioTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de cards para móvil */}
        <div className="md:hidden space-y-3">
          {reservas.map((reserva) => (
            <div
              key={reserva.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <IconMapPin className="size-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">
                    {reserva.espacioComun?.nombre || "Espacio"}
                  </span>
                </div>
                {getEstadoBadge(reserva.estado)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <IconCalendar className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Inicio</div>
                    <div className="font-medium">{formatDate(reserva.fechaInicio)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Fin</div>
                    <div className="font-medium">{formatDate(reserva.fechaFin)}</div>
                  </div>
                </div>
                {reserva.motivo && (
                  <div>
                    <div className="text-muted-foreground text-xs">Motivo</div>
                    <div className="font-medium">{reserva.motivo}</div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {reserva.cantidadPersonas && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <IconUsers className="size-3" />
                        {reserva.cantidadPersonas} personas
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-primary">
                    {formatCurrency(reserva.precioTotal)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


