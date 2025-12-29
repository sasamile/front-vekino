export interface KPIData {
  tenantsActivos: number;
  tenantsSuspendidos: number;
  tenantsPorVencer: number;
  mrr: number;
  churn: number;
}

export interface Alerta {
  id: number;
  tipo: string;
  mensaje: string;
  severidad: "alta" | "media" | "baja";
}

export interface Tenant {
  id: number;
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

