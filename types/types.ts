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

export type ResidenteRole =
  | "ADMIN"
  | "PROPIETARIO"
  | "ARRENDATARIO"
  | "RESIDENTE";
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
  temporaryPassword?: string;
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
export type ReservaEstado =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "CANCELADA"
  | "COMPLETADA";

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
  // Campos adicionales
  modoPago?: string | null;
  estadoPago?: string | null;
  archivoRecibo?: string | null;
  nombre?: string | null;
  correo?: string | null;
  casa?: string | null;
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
  // Campos opcionales para reserva manual
  nombre?: string;
  correo?: string;
  casa?: string;
  modoPago?: string;
  estadoPago?: string;
  // El recibo se envía como archivo en el multipart/form-data, no en el JSON body normal
  // pero lo definimos aquí para tener la referencia completa de opciones posibles
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

export interface DisponibilidadCompletaResponse {
  espacioComunId: string;
  espacioComun: {
    id: string;
    nombre: string;
    activo: boolean;
  };
  horariosDisponibilidad: HorarioDisponibilidad[];
  diasDisponibles: number[]; // 0-6 (0=Domingo)
  diasNoDisponibles: number[]; // 0-6 (0=Domingo)
  horasOcupadasPorDia: {
    [fecha: string]: Array<{
      horaInicio: string; // "HH:mm"
      horaFin: string; // "HH:mm"
    }>;
  };
  fechaDesde: string;
  fechaHasta: string;
}

// Finanzas - Facturas
export type FacturaEstado =
  | "PENDIENTE"
  | "ENVIADA"
  | "PAGADA"
  | "VENCIDA"
  | "CANCELADA";

export interface Factura {
  id: string;
  numeroFactura: string;
  unidadId: string;
  unidad?: {
    id: string;
    identificador: string;
    tipo: UnidadTipo;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  periodo: string; // "YYYY-MM"
  fechaEmision: string;
  fechaVencimiento: string;
  valor: number;
  descripcion: string | null;
  estado: FacturaEstado;
  fechaEnvio: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacturaRequest {
  unidadId: string;
  userId?: string;
  periodo: string; // "YYYY-MM"
  fechaVencimiento: string; // ISO 8601
  valor: number;
  descripcion?: string;
  observaciones?: string;
}

export interface CreateFacturasBulkRequest {
  periodo: string; // "YYYY-MM"
  fechaEmision: string; // ISO 8601
  fechaVencimiento: string; // ISO 8601
  enviarFacturas?: boolean;
}

export interface FacturasBulkResponse {
  total: number;
  facturas: Factura[];
}

export interface AporteVoluntario {
  id: string;
  nombre: string;
  unidadId: string;
  unidad?: {
    id: string;
    identificador: string;
    tipo: UnidadTipo;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  valor: number;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAporteVoluntarioRequest {
  nombre: string;
  unidadId: string;
  userId?: string;
  valor: number;
  descripcion: string;
}

// Finanzas - Pagos
export type PagoEstado =
  | "PENDIENTE"
  | "PROCESANDO"
  | "APROBADO"
  | "RECHAZADO"
  | "CANCELADO";
export type MetodoPago = "WOMPI" | "EFECTIVO";

export interface Pago {
  id: string;
  facturaId: string;
  factura?: {
    id: string;
    numeroFactura: string;
    valor: number;
    estado: FacturaEstado;
  };
  userId: string;
  valor: number;
  metodoPago: MetodoPago;
  estado: PagoEstado;
  wompiTransactionId: string | null;
  wompiReference: string | null;
  wompiPaymentLink: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  paymentLink?: string; // Link de pago para redirigir al usuario
  wompiStatus?: {
    id: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    reference: string;
    created_at: string;
    finalized_at: string | null;
  };
}

export interface CreatePagoRequest {
  facturaId: string;
  metodoPago?: MetodoPago;
  observaciones?: string;
}

// Comunicación - Tickets
export type TicketEstado = "ABIERTO" | "EN_PROGRESO" | "RESUELTO" | "CERRADO";
export type TicketPrioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  estado: TicketEstado;
  categoria: string | null;
  prioridad: TicketPrioridad;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  unidadId: string | null;
  unidad?: {
    id: string;
    identificador: string;
  };
  asignadoA: string | null;
  fechaResolucion: string | null;
  createdAt: string;
  updatedAt: string;
  comentariosCount?: number;
}

export interface CreateTicketRequest {
  titulo: string;
  descripcion: string;
  categoria?: string;
  prioridad?: TicketPrioridad;
  unidadId?: string;
}

export interface UpdateTicketRequest {
  titulo?: string;
  descripcion?: string;
  categoria?: string;
  prioridad?: TicketPrioridad;
  unidadId?: string;
  estado?: TicketEstado;
  asignadoA?: string;
}

export interface TicketComentario {
  id: string;
  ticketId: string;
  userId: string;
  contenido: string;
  esInterno: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface CreateTicketComentarioRequest {
  contenido: string;
  esInterno?: boolean;
}

export interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Comunicación - Foro
export type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "SAD" | "ANGRY";
export type AttachmentType = "IMAGEN" | "VIDEO" | "AUDIO" | "DOCUMENTO";

export interface PostAttachment {
  id: string;
  tipo: AttachmentType;
  url: string;
  nombre: string;
  tamaño: number;
  mimeType: string;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export interface PostReactions {
  LIKE: number;
  LOVE: number;
  LAUGH: number;
  WOW: number;
  SAD: number;
  ANGRY: number;
  total: number;
  userReaction: ReactionType | null;
}

export interface ReactionCount {
  tipo: ReactionType;
  count: number;
}

export interface Post {
  id: string;
  titulo: string | null;
  contenido: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  unidadId: string | null;
  unidad?: {
    id: string;
    identificador: string;
  };
  imagen: string | null; // Deprecated: usar attachments
  attachments?: PostAttachment[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  comentariosCount?: number;
  likesCount?: number; // Deprecated: usar reactionsCount
  userLiked?: boolean; // Deprecated: usar userReaction
  userReaction?: ReactionType | null; // Tipo de reacción del usuario actual
  reactionsCount?: ReactionCount[]; // Conteo por tipo de reacción
  reactions?: PostReactions; // Formato antiguo (deprecated)
}

export interface CreatePostRequest {
  titulo?: string;
  contenido: string;
  imagen?: string; // Deprecated: usar attachments
  unidadId?: string;
  attachments?: Array<{
    tipo: AttachmentType;
    url: string;
    nombre: string;
    tamaño: number;
    mimeType: string;
    thumbnailUrl?: string;
  }>;
}

export interface UpdatePostRequest {
  titulo?: string;
  contenido?: string;
  imagen?: string;
  activo?: boolean;
}

export interface PostComentario {
  id: string;
  postId: string;
  userId: string;
  contenido: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  unidad?: {
    id: string;
    identificador: string;
  };
}

export interface CreatePostComentarioRequest {
  contenido: string;
}

export interface CreatePostReactionRequest {
  tipo: ReactionType;
}

export interface PostsResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
