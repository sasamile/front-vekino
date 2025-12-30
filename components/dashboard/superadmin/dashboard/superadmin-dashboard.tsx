"use client";

import { AlertsSection } from "./alerts-section";
import { ChartsSection } from "./charts-section";
import { KPICards } from "./kpi-cards";
import { mockData } from "./mock-data";
import { TenantsTable } from "./tenants-table";



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
