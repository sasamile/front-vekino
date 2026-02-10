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
  IconSend,
  IconCurrencyDollar,
  IconTrash,
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
import type { Factura } from "@/types/types";

interface FacturasTableProps {
  facturas: Factura[];
  isLoading: boolean;
  error: Error | null;
  onView?: (factura: Factura) => void;
  onEnviar?: (factura: Factura) => void;
  onPagar?: (factura: Factura) => void;
  onDelete?: (factura: Factura) => void;
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

export function FacturasTable({
  facturas,
  isLoading,
  error,
  onView,
  onEnviar,
  onPagar,
  onDelete,
  isAdmin = false,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: FacturasTableProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Fecha inválida:", dateString);
      return dateString;
    }
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de Facturas</CardTitle>
            <CardDescription className="py-2">
              Gestiona todas las facturas del condominio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar las facturas. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Número</th>
                  <th className="text-left p-4 text-sm font-medium">Unidad</th>
                  <th className="text-left p-4 text-sm font-medium">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium">Período</th>
                  <th className="text-left p-4 text-sm font-medium">Vencimiento</th>
                  <th className="text-left p-4 text-sm font-medium">Valor</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-2 w-24 rounded-full" />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-2 w-16" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay facturas registradas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium">Número</th>
                    <th className="text-left p-4 text-sm font-medium">Unidad</th>
                    <th className="text-left p-4 text-sm font-medium">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium">Período</th>
                    <th className="text-left p-4 text-sm font-medium">Vencimiento</th>
                    <th className="text-left p-4 text-sm font-medium">Valor</th>
                    <th className="text-left p-4 text-sm font-medium">Estado</th>
                    <th className="text-left p-4 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => (
                    <tr
                      key={factura.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-sm">
                          {factura.numeroFactura}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">
                          {factura.unidad?.identificador || "N/A"}
                        </div>
                        {factura.unidad?.tipo && (
                          <div className="text-xs text-muted-foreground">
                            {factura.unidad.tipo}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">
                          {factura.user?.name || "N/A"}
                        </div>
                        {factura.user?.email && (
                          <div className="text-xs text-muted-foreground">
                            {factura.user.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs">{factura.periodo}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">{formatDate(factura.fechaVencimiento)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {formatCurrency(factura.valorConDescuento ?? factura.valor)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            ESTADO_COLORS[factura.estado] || ESTADO_COLORS.PENDIENTE
                          }`}
                        >
                          {ESTADO_LABELS[factura.estado] || factura.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              onClick={() => onView(factura)}
                              title="Ver factura"
                            >
                              <IconEye className="size-4" />
                            </Button>
                          )}
                          {isAdmin && onEnviar && factura.estado === "PENDIENTE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                              onClick={() => onEnviar(factura)}
                              title="Enviar factura"
                            >
                              <IconSend className="size-4" />
                            </Button>
                          )}
                          {onPagar && (factura.estado === "PENDIENTE" || factura.estado === "ENVIADA" || factura.estado === "VENCIDA" || factura.estado === "ABONADO") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-primary/10 hover:text-primary"
                              onClick={() => onPagar(factura)}
                              title="Pagar factura"
                            >
                              <IconCurrencyDollar className="size-4" />
                            </Button>
                          )}
                          {isAdmin && onDelete && factura.estado !== "PAGADA" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                                  title="Eliminar factura"
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
                                    Esta acción no se puede deshacer. Esto eliminará
                                    permanentemente la factura "{factura.numeroFactura}" 
                                    de la unidad {factura.unidad?.identificador || "N/A"}.
                                    Solo se pueden eliminar facturas que no tengan pagos asociados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(factura)}
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
                      {Math.min(currentPage * limit, total)} de {total} facturas
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

