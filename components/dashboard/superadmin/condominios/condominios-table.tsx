"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconBuilding, IconCheck, IconX, IconEye, IconEdit } from "@tabler/icons-react";
import type { Condominio } from "@/types/types";
import { CondominioLogo } from "./condominio-logo";

interface CondominiosTableProps {
  condominios: Condominio[];
  isLoading: boolean;
  error: Error | null;
  onView: (condominio: Condominio) => void;
  onEdit: (condominio: Condominio) => void;
}

export function CondominiosTable({
  condominios,
  isLoading,
  error,
  onView,
  onEdit,
}: CondominiosTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listado de Condominios</CardTitle>
            <CardDescription>
              {isLoading
                ? "Cargando..."
                : `${condominios.length} condominio${condominios.length !== 1 ? "s" : ""} encontrado${condominios.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los condominios. Por favor, intenta nuevamente.
          </div>
        )}

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Condominio</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">Plan</th>
                  <th className="text-left p-4 text-sm font-medium">Ubicación</th>
                  <th className="text-left p-4 text-sm font-medium">Vencimiento</th>
                  <th className="text-left p-4 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="size-16 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
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
        ) : condominios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconBuilding className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No se encontraron condominios con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Condominio</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">Plan</th>
                  <th className="text-left p-4 text-sm font-medium">Ubicación</th>
                  <th className="text-left p-4 text-sm font-medium">Vencimiento</th>
                  <th className="text-left p-4 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {condominios.map((condominio) => (
                  <tr key={condominio.id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <CondominioLogo
                          logo={condominio.logo}
                          name={condominio.name}
                          primaryColor={condominio.primaryColor}
                        />
                        <div>
                          <div className="font-semibold text-base">{condominio.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {condominio.subdomain}.vekino.site
                          </div>
                          <div className="text-xs text-muted-foreground">
                            NIT: {condominio.nit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          condominio.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {condominio.isActive ? (
                          <IconCheck className="size-3.5" />
                        ) : (
                          <IconX className="size-3.5" />
                        )}
                        {condominio.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{condominio.subscriptionPlan}</span>
                        <span className="text-xs text-muted-foreground">
                          Límite: {condominio.unitLimit} unidades
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{condominio.city}</span>
                        <span className="text-xs text-muted-foreground">
                          {condominio.country}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {condominio.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {new Date(condominio.planExpiresAt).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Creado: {new Date(condominio.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => onView(condominio)}
                        >
                          <IconEye className="size-4" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => onEdit(condominio)}
                        >
                          <IconEdit className="size-4" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

