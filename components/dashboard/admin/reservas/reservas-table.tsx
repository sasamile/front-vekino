"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconEye,
  IconCheck,
  IconX,
  IconBan,
} from "@tabler/icons-react";
import { Trash } from "lucide-react";
import type { Reserva } from "@/types/types";

interface ReservasTableProps {
  reservas: Reserva[];
  isLoading: boolean;
  error: Error | null;
  onView?: (reserva: Reserva) => void;
  onEdit?: (reserva: Reserva) => void;
  onDelete?: (reserva: Reserva) => void;
  onAprobar?: (reserva: Reserva) => void;
  onRechazar?: (reserva: Reserva) => void;
  onCancelar?: (reserva: Reserva) => void;
  isAdmin?: boolean;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
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

export function ReservasTable({
  reservas,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  onAprobar,
  onRechazar,
  onCancelar,
  isAdmin = false,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: ReservasTableProps) {
  // Formatear fecha de UTC a hora local
  // El backend retorna fechas en UTC (ej: "2026-01-02T14:00:00.000Z")
  // Necesitamos convertirlas a hora local para mostrarlas correctamente
  // Ejemplo: 14:00 UTC → 09:00 hora Colombia (UTC-5)
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    // Crear objeto Date desde la string UTC
    // Si viene con 'Z' o sin timezone, JavaScript lo interpreta como UTC
    const date = new Date(dateString);
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn("Fecha inválida:", dateString);
      return dateString;
    }
    
    // Convertir a hora local usando toLocaleString
    // Esto automáticamente convierte de UTC a la zona horaria del navegador
    return date.toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Usar timezone del navegador
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de Reservas</CardTitle>
            <CardDescription className="py-2">
              Gestiona todas las reservas de espacios comunes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar las reservas. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Espacio</th>
                  <th className="text-left p-4 text-sm font-medium">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium">Fecha Inicio</th>
                  <th className="text-left p-4 text-sm font-medium">Fecha Fin</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">Precio</th>
                  <th className="text-left p-4 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <IconCalendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay reservas registradas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium">Espacio</th>
                    <th className="text-left p-4 text-sm font-medium">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium">Fecha Inicio</th>
                    <th className="text-left p-4 text-sm font-medium">Fecha Fin</th>
                    <th className="text-left p-4 text-sm font-medium">Estado</th>
                    <th className="text-left p-4 text-sm font-medium">Precio</th>
                    <th className="text-left p-4 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => (
                    <tr
                      key={reserva.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-sm">
                          {reserva.espacioComun?.nombre || "N/A"}
                        </div>
                        {reserva.espacioComun?.tipo && (
                          <div className="text-xs text-muted-foreground">
                            {reserva.espacioComun.tipo}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">
                          {reserva.user?.name || "N/A"}
                        </div>
                        {reserva.user?.email && (
                          <div className="text-xs text-muted-foreground">
                            {reserva.user.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs">{formatDate(reserva.fechaInicio)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">{formatDate(reserva.fechaFin)}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            ESTADO_COLORS[reserva.estado] || ESTADO_COLORS.PENDIENTE
                          }`}
                        >
                          {ESTADO_LABELS[reserva.estado] || reserva.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          ${reserva.precioTotal.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              onClick={() => onView(reserva)}
                              title="Ver reserva"
                            >
                              <IconEye className="size-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-primary/10 hover:text-primary"
                              onClick={() => onEdit(reserva)}
                              title="Editar reserva"
                            >
                              <IconPencil className="size-4" />
                            </Button>
                          )}
                          {isAdmin && onAprobar && reserva.estado === "PENDIENTE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                              onClick={() => onAprobar(reserva)}
                              title="Aprobar reserva"
                            >
                              <IconCheck className="size-4" />
                            </Button>
                          )}
                          {isAdmin && onRechazar && reserva.estado === "PENDIENTE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              onClick={() => onRechazar(reserva)}
                              title="Rechazar reserva"
                            >
                              <IconX className="size-4" />
                            </Button>
                          )}
                          {onCancelar && (reserva.estado === "PENDIENTE" || reserva.estado === "CONFIRMADA") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                              onClick={() => onCancelar(reserva)}
                              title="Cancelar reserva"
                            >
                              <IconBan className="size-4" />
                            </Button>
                          )}
                          {isAdmin && onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDelete(reserva)}
                              title="Eliminar reserva"
                            >
                              <Trash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            {(totalPages > 1 || (total > 0 && onLimitChange)) && (
              <div className="shrink-0 flex items-center justify-between border-t pt-4 mt-4">
                <div className="flex items-center gap-4">
                  {total > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * limit + 1} -{" "}
                      {Math.min(currentPage * limit, total)} de {total} reservas
                      {totalPages > 1 &&
                        ` - Página ${currentPage} de ${totalPages}`}
                    </div>
                  )}
                  {onLimitChange && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Por página:
                      </span>
                      <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  )}
                </div>
                {onPageChange && totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <IconChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => onPageChange(pageNum)}
                              disabled={isLoading}
                              className="min-w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Siguiente
                      <IconChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

