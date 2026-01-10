"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useSubdomain } from "@/components/providers/subdomain-provider"
import { getAxiosInstance } from "@/lib/axios-config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconUsers,
  IconCalendar,
  IconBuilding,
  IconTrendingUp,
  IconAlertCircle,
  IconCash,
  IconFileInvoice,
  IconCheck,
  IconX,
  IconClock,
  IconReceipt,
  IconCalendarEvent,
  IconCreditCard,
} from "@tabler/icons-react"

interface DashboardOverview {
  totalUnidades: number
  unidadesOcupadas: number
  unidadesVacias: number
  reservasActivas: number
  recaudoMensual: number
  totalFacturadoMes: number
  totalRecaudadoMes: number
  pagosPendientes: number
  facturasVencidas: number
  unidadesMorosas: number
}

interface EstadosCuenta {
  pagosAlDia: number
  pagosPendientes: number
  morosidad: number
  totalUnidadesConFacturas: number
}

interface ActividadReciente {
  id: string
  tipo: string
  titulo: string
  fecha: string
  metadata?: {
    [key: string]: any
  }
}

interface ActividadResponse {
  actividades: ActividadReciente[]
  total: number
}

interface UserInfo {
  user: {
    id: string
    name: string
    email: string
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

const getTipoActividadLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    PAGO_PROCESADO: "Pago procesado",
    NUEVA_RESERVA: "Nueva reserva",
    FACTURA_CREADA: "Factura creada",
    FACTURA_VENCIDA: "Factura vencida",
    RESERVA_CANCELADA: "Reserva cancelada",
  }
  return labels[tipo] || tipo
}

const getTipoActividadIcon = (tipo: string) => {
  const icons: Record<string, React.ReactNode> = {
    PAGO_PROCESADO: <IconCreditCard className="h-5 w-5 text-green-600" />,
    NUEVA_RESERVA: <IconCalendarEvent className="h-5 w-5 text-blue-600" />,
    FACTURA_CREADA: <IconReceipt className="h-5 w-5 text-purple-600" />,
    FACTURA_VENCIDA: <IconAlertCircle className="h-5 w-5 text-red-600" />,
    RESERVA_CANCELADA: <IconX className="h-5 w-5 text-gray-600" />,
  }
  return icons[tipo] || <IconCalendar className="h-5 w-5 text-gray-600" />
}

const getTipoActividadColor = (tipo: string) => {
  const colors: Record<string, string> = {
    PAGO_PROCESADO: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30",
    NUEVA_RESERVA: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30",
    FACTURA_CREADA: "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30",
    FACTURA_VENCIDA: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30",
    RESERVA_CANCELADA: "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-900/30",
  }
  return colors[tipo] || "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-900/30"
}

const getSaludo = () => {
  const hora = new Date().getHours()
  if (hora < 12) return "Buenos días"
  if (hora < 18) return "Buenas tardes"
  return "Buenas noches"
}

export function AdminDashboard() {
  const { subdomain } = useSubdomain()

  // Obtener información del usuario actual
  const {
    data: userInfo,
    isLoading: isLoadingUser,
  } = useQuery<UserInfo>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/condominios/me")
      return response.data
    },
  })

  // Obtener dashboard overview
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
  } = useQuery<DashboardOverview>({
    queryKey: ["admin-metrics-dashboard"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/admin-metrics/dashboard")
      return response.data
    },
    refetchInterval: 60000, // Refrescar cada minuto
  })

  // Obtener estados de cuenta
  const {
    data: estadosCuenta,
    isLoading: isLoadingEstados,
  } = useQuery<EstadosCuenta>({
    queryKey: ["admin-metrics-estados-cuenta"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/admin-metrics/estados-cuenta")
      return response.data
    },
    refetchInterval: 60000,
  })

  // Obtener actividad reciente (todas las actividades)
  const {
    data: actividadData,
    isLoading: isLoadingActividad,
  } = useQuery<ActividadResponse>({
    queryKey: ["admin-metrics-actividad-reciente"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get(
        "/admin-metrics/actividad-reciente?limit=8"
      )
      return response.data
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  const actividadesRecientes = actividadData?.actividades || []
  const userName = userInfo?.user?.name || "Administrador"

  if (dashboardError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <IconAlertCircle className="h-5 w-5" />
              <p>Error al cargar las métricas del dashboard. Por favor, intenta nuevamente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header con saludo */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getSaludo()}, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen del estado de tu condominio
        </p>
      </div>

      {/* Estado de Cuenta - Cards principales */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Estado de Cuenta</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Ya Pagaron */}
          <Card className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Ya Pagaron
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEstados ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {(estadosCuenta?.pagosAlDia || 0) - (estadosCuenta?.pagosPendientes || 0)}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Unidades que ya pagaron sus facturas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* No Han Pagado */}
          <Card className="border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                No Han Pagado
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <IconClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEstados ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                    {estadosCuenta?.pagosPendientes || 0}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Unidades con facturas pendientes de pago
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Facturas Vencidas */}
          <Card className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Facturas Vencidas
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <IconAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEstados ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {estadosCuenta?.morosidad || 0}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                    Unidades con facturas vencidas sin pagar
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas Generales */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas Generales</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Unidades */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <IconBuilding className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.totalUnidades || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData?.unidadesOcupadas || 0} ocupadas • {dashboardData?.unidadesVacias || 0} vacías
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reservas Activas */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas Activas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <IconCalendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.reservasActivas || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requieren atención
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recaudo Mensual */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recaudo del Mes
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <IconTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.recaudoMensual?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(dashboardData?.totalRecaudadoMes || 0)} de {formatCurrency(dashboardData?.totalFacturadoMes || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Facturado */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <IconCash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.totalFacturadoMes || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mes actual
                </p>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas actividades del condominio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActividad ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : actividadesRecientes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconCalendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No hay actividad reciente</p>
              <p className="text-sm mt-1">Las actividades aparecerán aquí cuando ocurran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actividadesRecientes.map((actividad) => (
                <div
                  key={actividad.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-accent/50 ${getTipoActividadColor(actividad.tipo)}`}
                >
                  <div className="mt-0.5">
                    {getTipoActividadIcon(actividad.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-tight">
                      {actividad.titulo}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDate(actividad.fecha)}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      {getTipoActividadLabel(actividad.tipo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

