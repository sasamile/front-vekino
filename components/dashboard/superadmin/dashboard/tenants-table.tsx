"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconBuilding,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import type { Tenant } from "../../../types/types";

interface TenantsTableProps {
  tenants: Tenant[];
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              Listado completo de condominios en la plataforma
            </CardDescription>
          </div>
          <Button>Filtros</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium">Tenant</th>
                <th className="text-left p-3 text-sm font-medium">Estado</th>
                <th className="text-left p-3 text-sm font-medium">Plan</th>
                <th className="text-left p-3 text-sm font-medium">Uso</th>
                <th className="text-left p-3 text-sm font-medium">
                  Ubicación
                </th>
                <th className="text-left p-3 text-sm font-medium">
                  Vencimiento
                </th>
                <th className="text-left p-3 text-sm font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
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
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.estado === "activo"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {tenant.estado === "activo" ? (
                        <IconCheck className="w-3 h-3" />
                      ) : (
                        <IconX className="w-3 h-3" />
                      )}
                      {tenant.estado}
                    </span>
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
                            (tenant.unidades.usadas / tenant.unidades.limite) *
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
                    <div className="text-sm">{tenant.vencimiento}</div>
                    <div className="text-xs text-muted-foreground">
                      Último acceso: {tenant.ultimoAcceso}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

