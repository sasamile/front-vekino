"use client";

import { useState } from "react";
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
  IconCheck,
  IconX,
  IconEye,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { Tenant } from "@/types/types.ts";
import { ViewTenantDialog } from "./view-tenant-dialog";

interface TenantsTableProps {
  tenants: (Tenant & { planExpiresAtISO?: string })[];
  isLoading?: boolean;
}

// Función para calcular días restantes hasta el vencimiento
function getDaysUntilExpiration(planExpiresAtISO: string | undefined): {
  days: number;
  status: "vencido" | "por_vencer" | "activo";
} {
  if (!planExpiresAtISO) {
    return { days: 0, status: "activo" };
  }

  const expirationDate = new Date(planExpiresAtISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), status: "vencido" };
  } else if (diffDays <= 7) {
    return { days: diffDays, status: "por_vencer" };
  } else {
    return { days: diffDays, status: "activo" };
  }
}

// Función para obtener el estado del tenant considerando vencimiento
function getTenantStatus(
  estado: "activo" | "suspendido",
  planExpiresAtISO: string | undefined,
): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  const expiration = getDaysUntilExpiration(planExpiresAtISO);

  if (estado === "suspendido") {
    return {
      label: "Suspendido",
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      icon: <IconX className="w-3 h-3" />,
    };
  }

  if (expiration.status === "vencido") {
    return {
      label: "Vencido",
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      icon: <IconAlertTriangle className="w-3 h-3" />,
    };
  }

  if (expiration.status === "por_vencer") {
    return {
      label: "Por vencer",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      icon: <IconClock className="w-3 h-3" />,
    };
  }

  return {
    label: "Activo",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    icon: <IconCheck className="w-3 h-3" />,
  };
}

export function TenantsTable({
  tenants,
  isLoading = false,
}: TenantsTableProps) {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<
    (Tenant & { planExpiresAtISO?: string }) | null
  >(null);

  // Limitar a los primeros 5 tenants
  const displayedTenants = tenants.slice(0, 5);

  const handleView = (tenant: Tenant & { planExpiresAtISO?: string }) => {
    setSelectedTenant(tenant);
    setViewModalOpen(true);
  };
  return (
    <>
      <Card className="overflow-hidden py-0">
        <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10 border-b pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconBuilding className="h-6 w-6 text-primary" />
                Condominios Activos
              </CardTitle>
              <CardDescription className="mt-1.5">
                Gestión y monitoreo de todos los condominios en la plataforma
                {tenants.length > 5 && (
                  <span className="ml-1 font-medium">
                    · Mostrando 5 de {tenants.length}
                  </span>
                )}
              </CardDescription>
            </div>
            {tenants.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1.5 rounded-lg bg-background border">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-1.5 font-bold text-primary">
                    {tenants.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">
                      Tenant
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Estado
                    </th>
                    <th className="text-left p-3 text-sm font-medium">Plan</th>
                    <th className="text-left p-3 text-sm font-medium">Uso</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Ubicación
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Días restantes
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Último acceso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-12 mb-1" />
                        <Skeleton className="h-1.5 w-20 rounded-full" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : displayedTenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay tenants disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">
                      Tenant
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Estado
                    </th>
                    <th className="text-left p-3 text-sm font-medium">Plan</th>
                    <th className="text-left p-3 text-sm font-medium">Uso</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Ubicación
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Días restantes
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Último acceso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {tenant.logo ? (
                            <img
                              src={tenant.logo}
                              alt={tenant.nombre}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <IconBuilding className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{tenant.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {tenant.subdominio}.vekino.site
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {(() => {
                          const statusInfo = getTenantStatus(
                            tenant.estado,
                            tenant.planExpiresAtISO,
                          );
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{tenant.plan}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {tenant.unidades.usadas}/{tenant.unidades.limite}
                        </div>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${
                                (tenant.unidades.usadas /
                                  tenant.unidades.limite) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{tenant.ciudad}</div>
                        <div className="text-xs text-muted-foreground">
                          {tenant.pais}
                        </div>
                      </td>
                      <td className="p-3">
                        {(() => {
                          const expiration = getDaysUntilExpiration(
                            tenant.planExpiresAtISO,
                          );
                          if (expiration.status === "vencido") {
                            return (
                              <div className="text-sm font-medium text-red-600">
                                Vencido hace {expiration.days} día
                                {expiration.days !== 1 ? "s" : ""}
                              </div>
                            );
                          } else if (expiration.status === "por_vencer") {
                            return (
                              <div className="text-sm font-medium text-yellow-600">
                                {expiration.days} día
                                {expiration.days !== 1 ? "s" : ""} restante
                                {expiration.days !== 1 ? "s" : ""}
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm">
                                {expiration.days} día
                                {expiration.days !== 1 ? "s" : ""} restante
                                {expiration.days !== 1 ? "s" : ""}
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {tenant.ultimoAcceso === "Nunca" ? (
                              <span className="text-muted-foreground">
                                {tenant.ultimoAcceso}
                              </span>
                            ) : (
                              tenant.ultimoAcceso
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(tenant)}
                            className="gap-1 h-7 px-2"
                          >
                            <IconEye className="w-3.5 h-3.5" />
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

      <ViewTenantDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        tenant={selectedTenant}
      />
    </>
  );
}
