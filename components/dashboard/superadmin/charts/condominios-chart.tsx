"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChartComponent } from "../../charts/bar-chart";
import type { CondominioPorMes } from "../../../../types/types";

interface CondominiosChartProps {
  data: CondominioPorMes[];
}

export function CondominiosChart({ data }: CondominiosChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Condominios Creados por Mes</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChartComponent
          data={data.map((item) => ({
            label: item.mes,
            value: item.cantidad,
          }))}
          title="Condominios Creados por Mes"
          description="Últimos 6 meses"
        />
      </CardContent>
    </Card>
  );
}

