"use client";

import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import {
  getMetricsOverview,
  getMetricsTenants,
  getCondominiosByMonth,
  getPlanDistribution,
  getMRRGrowth,
  getCityDistribution,
  getAlerts,
} from "@/lib/api/metrics";
import { AlertsSection } from "./alerts-section";
import { ChartsSection } from "./charts-section";
import { KPICards } from "./kpi-cards";
import { TenantsTable } from "./tenants-table";
import type {
  KPIData,
  Alerta,
  Tenant,
  CondominioPorMes,
  TenantPorPlan,
  CrecimientoIngresos,
  TenantPorCiudad,
} from "@/types/types";

// Helper function to transform API data to component format
function transformOverviewToKPIData(
  overview: Awaited<ReturnType<typeof getMetricsOverview>>,
): KPIData {
  return {
    tenantsActivos: overview.activeTenants,
    tenantsSuspendidos: overview.suspendedTenants,
    tenantsPorVencer: overview.expiringSoon,
    mrr: overview.mrr,
    churn: overview.churn,
  };
}

function transformTenantsToComponentFormat(
  tenants: Awaited<ReturnType<typeof getMetricsTenants>>,
): (Tenant & { planExpiresAtISO: string })[] {
  return tenants.data.map((tenant) => ({
    id: tenant.id,
    nombre: tenant.name,
    subdominio: tenant.subdomain.replace(".vekino.site", ""),
    logo: null,
    estado: tenant.status,
    plan: tenant.plan,
    unidades: {
      usadas: tenant.usage.used,
      limite: tenant.usage.limit,
    },
    modulos: [],
    ciudad: tenant.city,
    pais: tenant.country,
    vencimiento: new Date(tenant.planExpiresAt).toLocaleDateString("es-CO"),
    ultimoAcceso: tenant.lastAccess
      ? new Date(tenant.lastAccess).toLocaleDateString("es-CO")
      : "Nunca",
    planExpiresAtISO: tenant.planExpiresAt, // Guardar la fecha ISO original
  }));
}

function transformAlertsToComponentFormat(
  alerts: Awaited<ReturnType<typeof getAlerts>>,
): Alerta[] {
  return alerts.alerts.map((alert, index) => ({
    id: `${alert.type}-${index}`,
    tipo: alert.type,
    mensaje: alert.title,
    severidad:
      alert.type === "expiring_plan"
        ? "alta"
        : ("media" as "alta" | "media" | "baja"),
    tenants: alert.tenants,
  }));
}

function transformCondominiosByMonth(
  data: Awaited<ReturnType<typeof getCondominiosByMonth>>,
): CondominioPorMes[] {
  // Group by month and sum counts for duplicate months
  const grouped = data.data.reduce(
    (acc, item) => {
      if (acc[item.month]) {
        acc[item.month] += item.count;
      } else {
        acc[item.month] = item.count;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return Object.entries(grouped)
    .map(([month, count]) => {
      const date = new Date(month + "-01");
      return {
        mes: monthNames[date.getMonth()],
        cantidad: count,
      };
    })
    .sort((a, b) => {
      // Sort by month order
      const monthOrder = monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes);
      return monthOrder;
    });
}

function transformPlanDistribution(
  data: Awaited<ReturnType<typeof getPlanDistribution>>,
): TenantPorPlan[] {
  return data.distribution.map((item) => ({
    plan: item.plan,
    cantidad: item.count,
  }));
}

function transformMRRGrowth(
  data: Awaited<ReturnType<typeof getMRRGrowth>>,
): CrecimientoIngresos[] {
  // Group by month and sum MRR for duplicate months
  const grouped = data.data.reduce(
    (acc, item) => {
      if (acc[item.month]) {
        acc[item.month] += item.mrr;
      } else {
        acc[item.month] = item.mrr;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return Object.entries(grouped)
    .map(([month, mrr]) => {
      const date = new Date(month + "-01");
      return {
        mes: monthNames[date.getMonth()],
        mrr: mrr,
      };
    })
    .sort((a, b) => {
      // Sort by month order
      const monthOrder = monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes);
      return monthOrder;
    });
}

function transformCityDistribution(
  data: Awaited<ReturnType<typeof getCityDistribution>>,
): TenantPorCiudad[] {
  return data.distribution.map((item) => ({
    ciudad: item.city,
    cantidad: item.count,
  }));
}

export function SuperAdminDashboard() {
  const { subdomain } = useSubdomain();

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["metrics", "overview", subdomain],
    queryFn: () => getMetricsOverview(subdomain),
  });

  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ["metrics", "tenants", subdomain],
    queryFn: () => getMetricsTenants(subdomain),
  });

  const { data: condominiosByMonth, isLoading: isLoadingCondominios } =
    useQuery({
      queryKey: ["metrics", "condominios-by-month", subdomain],
      queryFn: () => getCondominiosByMonth(subdomain),
    });

  const { data: planDistribution, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["metrics", "plan-distribution", subdomain],
    queryFn: () => getPlanDistribution(subdomain),
  });

  const { data: mrrGrowth, isLoading: isLoadingMRR } = useQuery({
    queryKey: ["metrics", "mrr-growth", subdomain],
    queryFn: () => getMRRGrowth(subdomain),
  });

  const { data: cityDistribution, isLoading: isLoadingCities } = useQuery({
    queryKey: ["metrics", "city-distribution", subdomain],
    queryFn: () => getCityDistribution(subdomain),
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["metrics", "alerts", subdomain],
    queryFn: () => getAlerts(subdomain),
  });

  const isLoading =
    isLoadingOverview ||
    isLoadingTenants ||
    isLoadingCondominios ||
    isLoadingPlans ||
    isLoadingMRR ||
    isLoadingCities ||
    isLoadingAlerts;

  const kpiData = overview ? transformOverviewToKPIData(overview) : null;
  const tenantsData = tenants ? transformTenantsToComponentFormat(tenants) : [];
  const alertsData = alerts ? transformAlertsToComponentFormat(alerts) : [];
  const condominiosData = condominiosByMonth
    ? transformCondominiosByMonth(condominiosByMonth)
    : [];
  const plansData = planDistribution
    ? transformPlanDistribution(planDistribution)
    : [];
  const mrrData = mrrGrowth ? transformMRRGrowth(mrrGrowth) : [];
  const citiesData = cityDistribution
    ? transformCityDistribution(cityDistribution)
    : [];

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="space-y-8 p-6 animate-in fade-in-50 duration-500">
      {/* Professional Header */}
      <div className="space-y-2 animate-in slide-in-from-top-2 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {getGreeting()} 👋
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Panel de control empresarial - Vekino Platform
            </p>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="rounded-3xl bg-linear-to-r from-primary to-primary/80 text-white p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-2">
          <p className="text-sm font-medium opacity-90">Panel de Administración</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Supervisión centralizada de condominios
          </h2>
          <p className="text-sm md:text-base opacity-90">
            Métricas clave, alertas y crecimiento en un solo lugar para tomar decisiones rápidas.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <KPICards data={kpiData} isLoading={isLoadingOverview} />
      </div>

      {/* Alerts Section */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <AlertsSection alertas={alertsData} isLoading={isLoadingAlerts} />
      </div>

      {/* Tenants Table */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <TenantsTable tenants={tenantsData} isLoading={isLoadingTenants} />
      </div>

      {/* Charts Section */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <ChartsSection
          graficas={{
            condominiosPorMes: condominiosData,
            tenantsPorPlan: plansData,
            crecimientoIngresos: mrrData,
            tenantsPorCiudad: citiesData,
          }}
          isLoading={
            isLoadingCondominios ||
            isLoadingPlans ||
            isLoadingMRR ||
            isLoadingCities
          }
        />
      </div>
    </div>
  );
}
