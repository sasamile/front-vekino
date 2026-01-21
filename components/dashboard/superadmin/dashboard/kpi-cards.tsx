"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBuilding,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
} from "@tabler/icons-react";
import { KPIData } from "@/types/types";

interface KPICardsProps {
  data: KPIData | null;
  isLoading?: boolean;
}

export function KPICards({ data, isLoading = false }: KPICardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="overflow-hidden rounded-xl border bg-card/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Tenants Activos */}
      <Card className="overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tenants Activos
          </CardTitle>
          <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconBuilding className="h-6 w-6" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {data.tenantsActivos}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
            {data.tenantsSuspendidos} suspendidos
          </p>
        </CardContent>
      </Card>

      {/* Por Vencer */}
      <Card className="overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50/70 via-card to-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Por Vencer (7 días)
          </CardTitle>
          <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconClock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {data.tenantsPorVencer}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <IconAlertTriangle className="h-3 w-3" />
            Requieren atención
          </p>
        </CardContent>
      </Card>

      {/* MRR */}
      <Card className="overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50/80 via-card to-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos Recurrentes
          </CardTitle>
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconTrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${data.mrr.toLocaleString("en-US")}
          </div>
          <p className="text-xs text-muted-foreground mt-2">MRR mensual</p>
        </CardContent>
      </Card>

      {/* Churn */}
      <Card className="overflow-hidden rounded-xl border bg-gradient-to-br from-red-50/80 via-card to-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tasa de Cancelación
          </CardTitle>
          <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconTrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {data.churn}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Cancelaciones este mes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
