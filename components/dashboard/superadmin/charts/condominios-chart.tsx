"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChartComponent } from "../../charts/bar-chart";
import type { CondominioPorMes } from "../../../../types/types";

interface CondominiosChartProps {
  data: CondominioPorMes[];
  isLoading?: boolean;
}

export function CondominiosChart({ data, isLoading = false }: CondominiosChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Condominios Creados por Mes</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <BarChartComponent
            data={data.map((item) => ({
              label: item.mes,
              value: item.cantidad,
            }))}
            title="Condominios Creados por Mes"
            description="Últimos 6 meses"
            hideHeader
          />
        )}
      </CardContent>
    </Card>
  );
}

