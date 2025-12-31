"use client";

import { CondominiosChart } from "../charts/condominios-chart";
import { PlanDistributionChart } from "../charts/plan-distribution-chart";
import { MRRChart } from "../charts/mrr-chart";
import { CityDistributionChart } from "../charts/city-distribution-chart";
import { DashboardData } from "@/types/types";

interface ChartsSectionProps {
  graficas: DashboardData["graficas"];
  isLoading?: boolean;
}

export function ChartsSection({ graficas, isLoading = false }: ChartsSectionProps) {
  return (
    <>
      {/* Primera fila de gráficas */}
      <div className="grid gap-4 md:grid-cols-2">
        <CondominiosChart data={graficas.condominiosPorMes} isLoading={isLoading} />
        <PlanDistributionChart data={graficas.tenantsPorPlan} isLoading={isLoading} />
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid gap-4 md:grid-cols-2">
        <MRRChart data={graficas.crecimientoIngresos} isLoading={isLoading} />
        <CityDistributionChart data={graficas.tenantsPorCiudad} isLoading={isLoading} />
      </div>
    </>
  );
}

