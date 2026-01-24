"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChartComponent } from "../../charts/line-chart";
import type { CrecimientoIngresos } from "../../../../types/types";

interface MRRChartProps {
  data: CrecimientoIngresos[];
  isLoading?: boolean;
}

export function MRRChart({ data, isLoading = false }: MRRChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crecimiento de Ingresos (MRR)</CardTitle>
        <CardDescription>
          Evolución mensual de ingresos recurrentes
        </CardDescription>
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
          <LineChartComponent
            data={data.map((item) => ({
              label: item.mes,
              value: item.mrr,
            }))}
            title="Crecimiento de Ingresos (MRR)"
            description="Evolución mensual de ingresos recurrentes"
            valueFormatter={(value) => `$${value.toLocaleString("en-US")}`}
            hideHeader
          />
        )}
      </CardContent>
    </Card>
  );
}

