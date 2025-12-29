"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChartComponent } from "../../charts/line-chart";
import type { CrecimientoIngresos } from "../../../../types/types";

interface MRRChartProps {
  data: CrecimientoIngresos[];
}

export function MRRChart({ data }: MRRChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crecimiento de Ingresos (MRR)</CardTitle>
        <CardDescription>
          Evolución mensual de ingresos recurrentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LineChartComponent
          data={data.map((item) => ({
            label: item.mes,
            value: item.mrr,
          }))}
          title="Crecimiento de Ingresos (MRR)"
          description="Evolución mensual de ingresos recurrentes"
          valueFormatter={(value) => `$${value.toLocaleString("en-US")}`}
        />
      </CardContent>
    </Card>
  );
}

