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
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconEye,
  IconBuilding,
} from "@tabler/icons-react";
import { Trash } from "lucide-react";
import type { Residente, Unidad } from "@/types/types";

interface ResidentesTableProps {
  residentes: Residente[];
  unidades?: Unidad[];
  isLoading: boolean;
  error: Error | null;
  onView?: (residente: Residente) => void;
  onEdit?: (residente: Residente) => void;
  onDelete?: (residente: Residente) => void;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PROPIETARIO: "Propietario",
  ARRENDATARIO: "Arrendatario",
  RESIDENTE: "Residente",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  PROPIETARIO:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  ARRENDATARIO:
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  RESIDENTE: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

const DOCUMENTO_LABELS: Record<string, string> = {
  CC: "Cédula",
  CE: "Cédula Extranjería",
  NIT: "NIT",
  PASAPORTE: "Pasaporte",
  OTRO: "Otro",
};

export function ResidentesTable({
  residentes,
  unidades = [],
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: ResidentesTableProps) {
  // Asegurar que residentes sea siempre un array
  const residentesArray = Array.isArray(residentes) ? residentes : [];
  console.log("RESIDENTES: ", residentesArray);

  // Función para obtener el identificador de la unidad
  const getUnidadIdentificador = (unidadId: string | undefined) => {
    if (!unidadId) return "No asignada";
    const unidad = unidades.find((u) => u.id === unidadId);
    return unidad ? `${unidad.identificador} - ${unidad.tipo}` : "No asignada";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de Residentes</CardTitle>
            <CardDescription className="py-2">
              Gestiona y administra todos los residentes del condominio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los residentes. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Avatar</th>
                  <th className="text-left p-4 text-sm font-medium">Nombre</th>
                  <th className="text-left p-4 text-sm font-medium">Email</th>
                  <th className="text-left p-4 text-sm font-medium">Rol</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Documento
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Unidad</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">
                      <Skeleton className="size-8 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : residentesArray.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <IconUser className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay residentes registrados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium">
                      Avatar
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Nombre
                    </th>
                    <th className="text-left p-4 text-sm font-medium">Email</th>
                    <th className="text-left p-4 text-sm font-medium">Rol</th>
                    <th className="text-left p-4 text-sm font-medium">
                      Documento
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Unidad
                    </th>
                    <th className="text-left p-4 text-sm font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {residentesArray.map((residente) => (
                    <tr
                      key={residente.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconUser className="size-4 text-primary" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-xs">
                          {residente.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">{residente.email}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            ROLE_COLORS[residente.role] || ROLE_COLORS.RESIDENTE
                          }`}
                        >
                          {ROLE_LABELS[residente.role] || residente.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <div>
                            {DOCUMENTO_LABELS[residente.tipoDocumento] ||
                              residente.tipoDocumento}
                          </div>
                          <div className="text-muted-foreground">
                            {residente.numeroDocumento}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <IconBuilding className="size-4 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {getUnidadIdentificador(residente.unidadId)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                              onClick={() => onView(residente)}
                              title="Ver residente"
                            >
                              <IconEye className="size-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-primary/10 hover:text-primary"
                              onClick={() => onEdit(residente)}
                              title="Editar residente"
                            >
                              <IconPencil className="size-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDelete(residente)}
                              title="Eliminar residente"
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
                      {Math.min(currentPage * limit, total)} de {total}{" "}
                      residentes
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
