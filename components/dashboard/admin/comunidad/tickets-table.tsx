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
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Ticket, TicketEstado } from "@/types/types";

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  error: Error | null;
  onView?: (ticket: Ticket) => void;
  onEdit?: (ticket: Ticket) => void;
  onDelete?: (ticket: Ticket) => void;
  onEstadoChange?: (ticket: Ticket, nuevoEstado: TicketEstado) => void;
  isAdmin?: boolean;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const ESTADO_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En Progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const ESTADO_COLORS: Record<string, string> = {
  ABIERTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  EN_PROGRESO:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  RESUELTO:
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  CERRADO: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
  MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export function TicketsTable({
  tickets,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  onEstadoChange,
  isAdmin = false,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: TicketsTableProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de solicitudes (PQRS)</CardTitle>
            <CardDescription className="py-2">
              Gestiona las solicitudes de PQRS de administración del condominio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar las solicitudes de PQRS. Por favor, intenta
            nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Título</th>
                  <th className="text-left p-3 text-sm font-medium">Usuario</th>
                  <th className="text-left p-3 text-sm font-medium">Unidad</th>
                  <th className="text-left p-3 text-sm font-medium">
                    Categoría
                  </th>
                  <th className="text-left p-3 text-sm font-medium">
                    Prioridad
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-3 text-sm font-medium">Fecha</th>
                  <th className="text-left p-3 text-sm font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <Skeleton className="h-2 w-20" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2  w-20" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-20" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-20" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-4 w-20 rounded-full" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-2 w-20" />
                    </td>

                    <td className="p-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay PQRS registradas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium">
                      Título
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Usuario
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Unidad
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Categoría
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Prioridad
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Estado
                    </th>
                    <th className="text-left p-4 text-sm font-medium">Fecha</th>
                    <th className="text-left p-4 text-sm font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-xs max-w-xs truncate">
                          {ticket.titulo}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-medium">
                          {ticket.user?.name || "N/A"}
                        </div>
                        {ticket.user?.email && (
                          <div className="text-xs text-muted-foreground">
                            {ticket.user.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          {ticket.unidad?.identificador || "N/A"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">
                          {ticket.categoria || "Sin categoría"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            PRIORIDAD_COLORS[ticket.prioridad] ||
                            PRIORIDAD_COLORS.MEDIA
                          }`}
                        >
                          {PRIORIDAD_LABELS[ticket.prioridad] ||
                            ticket.prioridad}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            ESTADO_COLORS[ticket.estado] ||
                            ESTADO_COLORS.ABIERTO
                          }`}
                        >
                          {ESTADO_LABELS[ticket.estado] || ticket.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-1 ">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              onClick={() => onView(ticket)}
                              title="Ver PQRS"
                            >
                              <IconEye className="size-4" />
                            </Button>
                          )}
                          {/* Acciones de administrador - siempre mostrar si las funciones están definidas */}
                          {onEstadoChange && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 h-8 px-2 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                                  title="Cambiar estado"
                                >
                                  <IconRefresh className="size-4" />
                                  <IconChevronDown className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    onEstadoChange(ticket, "ABIERTO")
                                  }
                                  disabled={ticket.estado === "ABIERTO"}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-blue-500" />
                                    Abrir
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onEstadoChange(ticket, "EN_PROGRESO")
                                  }
                                  disabled={ticket.estado === "EN_PROGRESO"}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-yellow-500" />
                                    Recibir / En Progreso
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onEstadoChange(ticket, "RESUELTO")
                                  }
                                  disabled={ticket.estado === "RESUELTO"}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-green-500" />
                                    Resolver
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onEstadoChange(ticket, "CERRADO")
                                  }
                                  disabled={ticket.estado === "CERRADO"}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-gray-500" />
                                    Cerrar
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                              onClick={() => onEdit(ticket)}
                              title="Editar PQRS"
                            >
                              <IconEdit className="size-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                                  title="Eliminar PQRS"
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás absolutamente seguro?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto
                                    eliminará permanentemente la solicitud "
                                    {ticket.titulo}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(ticket)}
                                    className="bg-destructive px-4 py-2 rounded-md text-white hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                      {Math.min(currentPage * limit, total)} de {total} PQRS
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
                        },
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
