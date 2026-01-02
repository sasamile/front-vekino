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

export type UnidadTipo = "APARTAMENTO" | "CASA" | "LOCAL_COMERCIAL";
export type UnidadEstado = "VACIA" | "OCUPADA" | "EN_MANTENIMIENTO";

export interface Unidad {
  id: string;
  identificador: string;
  tipo: UnidadTipo;
  area: number;
  coeficienteCopropiedad: number;
  valorCuotaAdministracion: number;
  estado: UnidadEstado;
  condominioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnidadRequest {
  identificador: string;
  tipo: UnidadTipo;
  area: number;
  coeficienteCopropiedad: number;
  valorCuotaAdministracion: number;
  estado: UnidadEstado;
}

export type ResidenteRole = "ADMIN" | "PROPIETARIO" | "ARRENDATARIO" | "RESIDENTE";
export type TipoDocumento = "CC" | "CE" | "NIT" | "PASAPORTE" | "OTRO";

export interface Residente {
  id: string;
  name: string;
  email: string;
  role: ResidenteRole;
  firstName: string;
  lastName: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  telefono: string;
  unidadId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadWithResidentesResponse extends Unidad {
  usuarios: Residente[];
  totalUsuarios: number;
}

export interface CreateResidenteRequest {
  name: string;
  email: string;
  password: string;
  role: ResidenteRole;
  firstName: string;
  lastName: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  telefono: string;
  unidadId: string;
}

export interface UpdateResidenteRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: ResidenteRole;
  firstName?: string;
  lastName?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  telefono?: string;
  unidadId?: string;
}

// Espacios Comunes
export type EspacioComunTipo = 
  | "SALON_SOCIAL"
  | "ZONA_BBQ"
  | "SAUNA"
  | "CASA_EVENTOS"
  | "GIMNASIO"
  | "PISCINA"
  | "CANCHA_DEPORTIVA"
  | "PARQUEADERO"
  | "OTRO";

export type UnidadTiempo = "HORAS" | "DIAS" | "MESES";

export interface HorarioDisponibilidad {
  dia: number; // 0-6 (Lunes-Domingo)
  horaInicio: string; // "09:00"
  horaFin: string; // "22:00"
}

export interface EspacioComun {
  id: string;
  nombre: string;
  tipo: EspacioComunTipo;
  capacidad: number;
  descripcion: string | null;
  unidadTiempo: UnidadTiempo;
  precioPorUnidad: number;
  activo: boolean;
  imagen: string | null;
  horariosDisponibilidad: string; // JSON string
  requiereAprobacion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEspacioComunRequest {
  nombre: string;
  tipo: EspacioComunTipo;
  capacidad: number;
  descripcion?: string;
  unidadTiempo: UnidadTiempo;
  precioPorUnidad: number;
  activo?: boolean;
  horariosDisponibilidad: string; // JSON string
  requiereAprobacion?: boolean;
}

export interface UpdateEspacioComunRequest {
  nombre?: string;
  tipo?: EspacioComunTipo;
  capacidad?: number;
  descripcion?: string;
  unidadTiempo?: UnidadTiempo;
  precioPorUnidad?: number;
  activo?: boolean;
  horariosDisponibilidad?: string;
  requiereAprobacion?: boolean;
}

// Reservas
export type ReservaEstado = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";

export interface Reserva {
  id: string;
  espacioComunId: string;
  espacioComun?: EspacioComun;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  unidadId: string | null;
  unidad?: {
    id: string;
    identificador: string;
  };
  fechaInicio: string;
  fechaFin: string;
  cantidadPersonas: number | null;
  estado: ReservaEstado;
  motivo: string | null;
  observaciones: string | null;
  precioTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservaRequest {
  espacioComunId: string;
  unidadId?: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadPersonas?: number;
  motivo?: string;
  observaciones?: string;
}

export interface UpdateReservaRequest {
  espacioComunId?: string;
  unidadId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  cantidadPersonas?: number;
  motivo?: string;
  observaciones?: string;
  estado?: ReservaEstado;
}

