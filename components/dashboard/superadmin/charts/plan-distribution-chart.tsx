"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TenantPorPlan } from "../../../../types/types";

interface PlanDistributionChartProps {
  data: TenantPorPlan[];
}

const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500"];

export function PlanDistributionChart({
  data,
}: PlanDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Plan</CardTitle>
        <CardDescription>Tenants activos por tipo de plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.cantidad / total) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-muted-foreground">
                    {item.cantidad} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[index]} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

