"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TenantPorCiudad } from "../../../../types/types";

interface CityDistributionChartProps {
  data: TenantPorCiudad[];
  isLoading?: boolean;
}

const colors = [
  "bg-primary",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-rose-500",
];

export function CityDistributionChart({
  data,
  isLoading = false,
}: CityDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <Card className="border bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Distribución por Ciudad</CardTitle>
            <CardDescription>Condominios activos por ubicación</CardDescription>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            Total: {total}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => {
              const percentage = (item.cantidad / total) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2.5 rounded-full ${colors[index % colors.length]}`}
                      />
                      <span className="font-medium">{item.ciudad}</span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {item.cantidad} • {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden bg-muted/60">
                    <div
                      className={`h-full ${colors[index % colors.length]} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

