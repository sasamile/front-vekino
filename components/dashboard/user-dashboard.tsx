"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useSubdomain } from "@/components/providers/subdomain-provider"
import { getAxiosInstance } from "@/lib/axios-config"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconHome,
  IconCalendar,
  IconCreditCard,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconX,
  IconArrowRight,
  IconTicket,
  IconReceipt,
  IconFileDownload,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { Reserva, ReservaEstado, Factura, FacturaEstado, Ticket, TicketEstado } from "@/types/types"

interface ResumenPagos {
  pendientes: {
    cantidad: number;
    valor: number;
  };
  vencidas: {
    cantidad: number;
    valor: number;
  };
  pagadas: {
    cantidad: number;
    valor: number;
  };
  proximoVencimiento: {
    numeroFactura: string;
    fechaVencimiento: string;
    valor: number;
    estado: FacturaEstado;
  } | null;
}

interface MisPagosResponse {
  resumen: ResumenPagos;
  facturas: Factura[];
  total: number;
}

interface UsuarioInfo {
  id: string;
  name: string;
  email: string;
  unidadId?: string;
  unidad?: {
    id: string;
    identificador: string;
    torre?: string;
    piso?: string;
    numero?: string;
  };
}

/** Respuesta unificada del endpoint GET /usuario/dashboard */
interface DashboardResponse {
  user: UsuarioInfo;
  misPagos: MisPagosResponse;
  reservasActivas: Reserva[];
  ticketsAbiertos: Ticket[];
}

export function UserDashboard() {
  const { subdomain } = useSubdomain()
  const router = useRouter()

  // Una sola petición: usuario, pagos, reservas activas y tickets abiertos
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardResponse>({
    queryKey: ["usuario-dashboard"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/usuario/dashboard")
      return response.data
    },
    retry: false,
    throwOnError: false,
  })

  const usuarioInfo = dashboardData?.user
  const misPagos = dashboardData?.misPagos
  const reservasActivas = dashboardData?.reservasActivas ?? []
  const ticketsAbiertos = dashboardData?.ticketsAbiertos ?? []

  // Función para obtener saludo según la hora
  const obtenerSaludo = (): string => {
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) {
      return "Buenos días"
    } else if (hora >= 12 && hora < 19) {
      return "Buenas tardes"
    } else {
      return "Buenas noches"
    }
  }

  // Calcular si está al día
  const estaAlDia = misPagos?.resumen
    ? misPagos.resumen.vencidas?.cantidad === 0 && misPagos.resumen.pendientes?.cantidad === 0
    : false

  // Obtener próximo pago
  const proximoPago = misPagos?.resumen?.proximoVencimiento
    ? misPagos.facturas.find(
        (f) => f.numeroFactura === misPagos.resumen.proximoVencimiento?.numeroFactura
      ) || null
    : null

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Formatear moneda
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Obtener identificador de unidad (user del dashboard incluye unidad si tiene unidadId)
  const getUnidadIdentificador = () => {
    if (usuarioInfo?.unidad?.identificador) {
      return usuarioInfo.unidad.identificador
    }
    if (usuarioInfo?.unidadId) {
      return "Cargando unidad..."
    }
    return "Sin unidad asignada"
  }

  // Obtener badge de estado de reserva
  const getReservaBadge = (estado: ReservaEstado) => {
    const variants: Record<ReservaEstado, { variant: "default" | "destructive" | "secondary"; label: string }> = {
      CONFIRMADA: {
        variant: "default",
        label: "Confirmada",
      },
      PENDIENTE: {
        variant: "secondary",
        label: "Pendiente",
      },
      CANCELADA: {
        variant: "destructive",
        label: "Cancelada",
      },
      COMPLETADA: {
        variant: "default",
        label: "Completada",
      },
    }
    const config = variants[estado] || {
      variant: "secondary" as const,
      label: estado,
    }
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Obtener badge de estado de ticket
  const getTicketBadge = (estado: TicketEstado) => {
    const variants: Record<TicketEstado, { variant: "default" | "destructive" | "secondary"; label: string }> = {
      ABIERTO: {
        variant: "secondary",
        label: "Abierto",
      },
      EN_PROGRESO: {
        variant: "default",
        label: "En Progreso",
      },
      RESUELTO: {
        variant: "default",
        label: "Resuelto",
      },
      CERRADO: {
        variant: "destructive",
        label: "Cerrado",
      },
    }
    const config = variants[estado] || {
      variant: "secondary" as const,
      label: estado,
    }
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Determinar el estado de facturas para el color (sistema semáforo)
  const tieneVencidas = (misPagos?.resumen?.vencidas?.cantidad || 0) > 0
  const tienePendientes = (misPagos?.resumen?.pendientes?.cantidad || 0) > 0
  const estadoColor = estaAlDia 
    ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10"
    : tieneVencidas
    ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10"
    : "border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10"

  // Get current time for greeting with matching emoji
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Buenos días", emoji: "🌅" };
    if (hour < 18) return { text: "Buenas tardes", emoji: "🌤️" };
    return { text: "Buenas noches", emoji: "🌙" };
  };

  const { text: greetingText, emoji: greetingEmoji } = getGreeting();
  const firstName = (usuarioInfo?.name?.split(" ")[0] || "Usuario").toUpperCase();
  const AVAL_URL = process.env.NEXT_PUBLIC_AVAL_URL || "https://www.avalpaycenter.com/wps/portal/portal-de-pagos/web/pagos-aval";

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header con saludo mejorado */}
      <div className="rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-white/90">
              TU COMUNIDAD
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {greetingText} , {firstName}
            </h1>
            <p className="text-white/90 text-sm md:text-base">
              {getUnidadIdentificador()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" />
        </div>
      </div>

      {/* Saludo y Estado de Facturas */}
      <Card
        className={cn(
          "rounded-2xl shadow-sm bg-white border",
          tieneVencidas ? "border-red-100 shadow-red-50" : "border-gray-100"
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-gray-800">
            Estado de Facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {estaAlDia ? (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 shrink-0">
                    <IconCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-green-700">
                      Estás al día
                    </p>
                    <p className="text-sm text-green-600">
                      No tienes facturas pendientes
                    </p>
                  </div>
                </>
              ) : tieneVencidas ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 shadow-lg shadow-red-200 dark:shadow-red-900/50">
                    <IconAlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    {proximoPago && (
                      <div className="text-2xl font-bold text-red-600 mb-0 leading-none">
                        {formatCurrency(proximoPago.valor)}
                      </div>
                    )}
                    <p className="font-bold text-base text-red-600 mt-1">
                      Tienes facturas vencidas
                    </p>
                    <p className="text-sm text-red-500">
                      {misPagos?.resumen?.vencidas?.cantidad || 0} vencidas,{" "}
                      {misPagos?.resumen?.pendientes?.cantidad || 0} pendientes
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 shrink-0">
                    <IconAlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    {proximoPago && (
                      <div className="text-2xl font-bold text-orange-700 mb-0 leading-none">
                        {formatCurrency(proximoPago.valor)}
                      </div>
                    )}
                    <p className="font-bold text-base text-orange-700 mt-1">
                      Tienes facturas pendientes
                    </p>
                    <p className="text-sm text-orange-600">
                      {misPagos?.resumen?.pendientes?.cantidad || 0} pendientes de pago
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                variant={estaAlDia ? "default" : "destructive"}
                className={cn(
                  "rounded-full px-6",
                  estaAlDia && "bg-green-600 hover:bg-green-700 text-white",
                  !estaAlDia && "bg-red-600 hover:bg-red-700 text-white"
                )}
                onClick={() => {
                  if (!estaAlDia && AVAL_URL) {
                    window.open(AVAL_URL, "_blank");
                  } else {
                    router.push("/pagos");
                  }
                }}
              >
                {estaAlDia ? "Ver Pagos" : "Pagar Ahora"}
                <IconArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Próximo Pago */}
        <Card
          className="hover:shadow-md transition-shadow bg-gradient-to-br from-[#00C853] to-[#009624] text-white border-0 shadow-sm cursor-pointer rounded-2xl overflow-hidden relative"
          onClick={() => router.push("/pagos")}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Próximo Pago
            </CardTitle>
            <IconCreditCard className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            {proximoPago ? (
              <>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(proximoPago.valor)}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[10px] text-white/90 uppercase tracking-wider font-medium">
                    Vence: {formatDate(proximoPago.fechaVencimiento)}
                  </p>
                  <p className="text-[10px] text-white/80 font-mono">
                    {proximoPago.numeroFactura}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-white/50 mt-1">-</div>
                <p className="text-xs text-white/80 mt-2">
                  No hay pagos pendientes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reservas Activas */}
        <Card
          className="hover:shadow-md transition-shadow bg-gradient-to-br from-[#448AFF] to-[#2962FF] text-white border-0 shadow-sm cursor-pointer rounded-2xl overflow-hidden relative"
          onClick={() => router.push("/reservations")}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Reservas Activas
            </CardTitle>
            <IconCalendar className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mt-1">
              {reservasActivas.length}
            </div>
            <p className="text-xs text-white/80 mt-2">
              {reservasActivas.length === 1
                ? "Reserva activa"
                : "Reservas activas"}
            </p>
          </CardContent>
        </Card>

        {/* Tickets Abiertos */}
        <Card
          className="hover:shadow-md transition-shadow bg-gradient-to-br from-[#FF9100] to-[#FF6D00] text-white border-0 shadow-sm cursor-pointer rounded-2xl overflow-hidden relative"
          onClick={() => router.push("/comunicacion")}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Tickets Abiertos
            </CardTitle>
            <IconTicket className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mt-1">
              {ticketsAbiertos.length}
            </div>
            <p className="text-xs text-white/80 mt-2">
              {ticketsAbiertos.length === 1
                ? "Ticket abierto"
                : "Tickets abiertos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historial y Reservas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Historial de Pagos */}
        <Card className="rounded-2xl shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-800">Historial de Pagos</CardTitle>
                <CardDescription>
                  Últimas facturas y pagos
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:bg-transparent hover:text-primary"
                onClick={() => router.push("/pagos")}
              >
                Ver historial completo
                <IconArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {misPagos?.facturas && misPagos.facturas.length > 0 ? (
              <div className="space-y-3">
                {misPagos.facturas.slice(0, 3).map((factura) => (
                  <div
                    key={factura.id}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-gray-700">
                        {factura.descripcion || "Cuota de administración"} - {factura.periodo}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(factura.fechaEmision)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-900">
                        {formatCurrency(factura.valor)}
                      </span>
                      {factura.estado === "PAGADA" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none text-[10px]">PAGADA</Badge>
                      ) : factura.estado === "VENCIDA" ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none text-[10px]">VENCIDA</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-none text-[10px]">PENDIENTE</Badge>
                      )}
                      <a
                        href={`/api/finanzas/mis-facturas/${factura.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-6 w-6 text-gray-400 hover:text-primary transition-colors"
                      >
                         <IconFileDownload className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No hay historial disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas Activas (Lista o Empty State) */}
        <Card className="rounded-2xl shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-800">Reservas Activas</CardTitle>
                <CardDescription>
                  Próximas reservas confirmadas
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:bg-transparent hover:text-primary"
                onClick={() => router.push("/reservations")}
              >
                Ver todas
                <IconArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reservasActivas.length > 0 ? (
            <div className="space-y-3">
                {reservasActivas.slice(0, 3).map((reserva) => (
                <div
                  key={reserva.id}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-700">
                        {reserva.espacioComun?.nombre || "Espacio"}
                      </div>
                    <div className="text-xs text-gray-500">
                        {formatDateTime(reserva.fechaInicio)}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getReservaBadge(reserva.estado)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <IconCalendar className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-4">No tienes reservas activas</p>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                  size="sm"
                  onClick={() => router.push("/reservations")}
                >
                  Crear Reserva
              </Button>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
