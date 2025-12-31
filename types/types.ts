// API Response Types
export interface MetricsOverviewResponse {
  activeTenants: number;
  suspendedTenants: number;
  expiringSoon: number;
  requiresAttention: number;
  mrr: number;
  churn: number;
}

export interface TenantUsage {
  used: number;
  limit: number;
}

export interface TenantFromAPI {
  id: string;
  name: string;
  subdomain: string;
  status: "activo" | "suspendido";
  plan: string;
  usage: TenantUsage;
  city: string;
  country: string;
  planExpiresAt: string;
  lastAccess: string | null;
}

export interface TenantsResponse {
  data: TenantFromAPI[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CondominiosByMonthData {
  month: string;
  count: number;
}

export interface CondominiosByMonthResponse {
  data: CondominiosByMonthData[];
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
  percentage: number;
}

export interface PlanDistributionResponse {
  distribution: PlanDistributionItem[];
}

export interface MRRGrowthData {
  month: string;
  mrr: number;
}

export interface MRRGrowthResponse {
  data: MRRGrowthData[];
}

export interface CityDistributionItem {
  city: string;
  count: number;
  percentage: number;
}

export interface CityDistributionResponse {
  distribution: CityDistributionItem[];
}

export interface AlertTenant {
  id: string;
  name: string;
  subdomain: string;
  planExpiresAt: string;
  daysUntilExpiration: number;
  usage: TenantUsage | null;
}

export interface Alert {
  type: string;
  title: string;
  count: number;
  actionText: string;
  tenants: AlertTenant[];
}

export interface AlertsResponse {
  alerts: Alert[];
}

// Legacy types for backward compatibility (mapped from API)
export interface KPIData {
  tenantsActivos: number;
  tenantsSuspendidos: number;
  tenantsPorVencer: number;
  mrr: number;
  churn: number;
}

export interface Alerta {
  id: string;
  tipo: string;
  mensaje: string;
  severidad: "alta" | "media" | "baja";
  tenants?: AlertTenant[];
}

export interface Tenant {
  id: string;
  nombre: string;
  subdominio: string;
  logo: string | null;
  estado: "activo" | "suspendido";
  plan: string;
  unidades: {
    usadas: number;
    limite: number;
  };
  modulos: string[];
  ciudad: string;
  pais: string;
  vencimiento: string;
  ultimoAcceso: string;
}

export interface CondominioPorMes {
  mes: string;
  cantidad: number;
}

export interface TenantPorPlan {
  plan: string;
  cantidad: number;
}

export interface CrecimientoIngresos {
  mes: string;
  mrr: number;
}

export interface TenantPorCiudad {
  ciudad: string;
  cantidad: number;
}

export interface DashboardData {
  kpis: KPIData;
  alertas: Alerta[];
  graficas: {
    condominiosPorMes: CondominioPorMes[];
    tenantsPorPlan: TenantPorPlan[];
    crecimientoIngresos: CrecimientoIngresos[];
    tenantsPorCiudad: TenantPorCiudad[];
  };
  tenants: Tenant[];
}

export interface Condominio {
  id: string;
  name: string;
  subdomain: string;
  nit: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  logo: string | null;
  primaryColor: string;
  subscriptionPlan: string;
  unitLimit: number;
  planExpiresAt: string;
  activeModules: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type PlanType = "BASICO" | "PRO" | "ENTERPRISE";

export interface PlanPricing {
  id: string;
  plan: PlanType;
  monthlyPrice: number;
  yearlyPrice: number | null;
  description: string | null;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPricingRequest {
  plan: PlanType;
  monthlyPrice: number;
  yearlyPrice?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export interface UpdatePlanPricingRequest {
  monthlyPrice?: number;
  yearlyPrice?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

