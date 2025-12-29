"use client";

import { TenantsTable } from "./tenants-table";
import { mockData } from "./dashboard/mock-data";
import { KPICards } from "./dashboard/kpi-cards";
import { AlertsSection } from "./dashboard/alerts-section";
import { ChartsSection } from "./dashboard/charts-section";

export function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <KPICards data={mockData.kpis} />
      <AlertsSection alertas={mockData.alertas} />
      <TenantsTable tenants={mockData.tenants} />
      <ChartsSection graficas={mockData.graficas} />
    </div>
  );
}
