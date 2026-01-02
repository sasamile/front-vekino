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
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
} from "@tabler/icons-react";
import { Trash } from "lucide-react";
import type { EspacioComun } from "@/types/types";

interface EspaciosTableProps {
  espacios: EspacioComun[];
  isLoading: boolean;
  error: Error | null;
  onEdit?: (espacio: EspacioComun) => void;
  onDelete?: (espacio: EspacioComun) => void;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const TIPO_LABELS: Record<string, string> = {
  SALON_SOCIAL: "Salón Social",
  ZONA_BBQ: "Zona BBQ",
  SAUNA: "Sauna",
  CASA_EVENTOS: "Casa de Eventos",
  GIMNASIO: "Gimnasio",
  PISCINA: "Piscina",
  CANCHA_DEPORTIVA: "Cancha Deportiva",
  PARQUEADERO: "Parqueadero",
  OTRO: "Otro",
};

const UNIDAD_TIEMPO_LABELS: Record<string, string> = {
  HORAS: "Horas",
  DIAS: "Días",
  MESES: "Meses",
};

export function EspaciosTable({
  espacios,
  isLoading,
  error,
  onEdit,
  onDelete,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: EspaciosTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de Espacios Comunes</CardTitle>
            <CardDescription className="py-2">
              Gestiona todos los espacios comunes disponibles para reservas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los espacios comunes. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Nombre</th>
                  <th className="text-left p-4 text-sm font-medium">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium">Capacidad</th>
                  <th className="text-left p-4 text-sm font-medium">Precio</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
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
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
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
        ) : espacios.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <IconBuilding className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay espacios comunes registrados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium">Nombre</th>
                    <th className="text-left p-4 text-sm font-medium">Tipo</th>
                    <th className="text-left p-4 text-sm font-medium">Capacidad</th>
                    <th className="text-left p-4 text-sm font-medium">Precio</th>
                    <th className="text-left p-4 text-sm font-medium">Estado</th>
                    <th className="text-left p-4 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {espacios.map((espacio) => (
                    <tr
                      key={espacio.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <IconBuilding className="size-4 text-muted-foreground" />
                          <span className="font-medium">{espacio.nombre}</span>
                        </div>
                        {espacio.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {espacio.descripcion.length > 50
                              ? `${espacio.descripcion.substring(0, 50)}...`
                              : espacio.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{TIPO_LABELS[espacio.tipo] || espacio.tipo}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{espacio.capacidad} personas</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="font-medium">
                            ${espacio.precioPorUnidad.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground"> / {UNIDAD_TIEMPO_LABELS[espacio.unidadTiempo]}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            espacio.activo
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                        >
                          {espacio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-primary/10 hover:text-primary"
                              onClick={() => onEdit(espacio)}
                              title="Editar espacio"
                            >
                              <IconPencil className="size-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDelete(espacio)}
                              title="Eliminar espacio"
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
                      {Math.min(currentPage * limit, total)} de {total} espacios
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

