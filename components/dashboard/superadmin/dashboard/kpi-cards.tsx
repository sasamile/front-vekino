"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBuilding,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { KPIData } from "@/types/types";

interface KPICardsProps {
  data: KPIData | null;
  isLoading?: boolean;
}

export function KPICards({ data, isLoading = false }: KPICardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tenants Activos</CardTitle>
          <IconBuilding className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.tenantsActivos}</div>
          <p className="text-xs text-muted-foreground">
            {data.tenantsSuspendidos} suspendidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Por Vencer (7 días)
          </CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {data.tenantsPorVencer}
          </div>
          <p className="text-xs text-muted-foreground">Requieren atención</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.mrr.toLocaleString("en-US")}
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresos recurrentes mensuales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Churn</CardTitle>
          <IconTrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{data.churn}</div>
          <p className="text-xs text-muted-foreground">
            Cancelaciones este mes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

