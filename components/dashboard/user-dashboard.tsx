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

interface UnidadInfo {
  id: string;
  identificador: string;
  tipo: string;
  area?: number;
  coeficienteCopropiedad?: number;
  valorCuotaAdministracion?: number;
  estado?: string;
  totalUsuarios?: number;
}

export function UserDashboard() {
  const { subdomain } = useSubdomain()
  const router = useRouter()

  // Obtener información del usuario
  const { data: usuarioInfo, isLoading: usuarioLoading } = useQuery<UsuarioInfo>({
    queryKey: ["usuario-info"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/condominios/me")
      return response.data.user || response.data
    },
  })

  // Obtener información de la unidad si existe unidadId
  const { data: unidadInfo } = useQuery<UnidadInfo>({
    queryKey: ["unidad-info", usuarioInfo?.unidadId],
    queryFn: async () => {
      if (!usuarioInfo?.unidadId) return null
      const axiosInstance = getAxiosInstance(subdomain)
      try {
        const response = await axiosInstance.get(`/unidades/public/${usuarioInfo.unidadId}`)
        return response.data
      } catch {
        return null
      }
    },
    enabled: !!usuarioInfo?.unidadId,
  })

  // Obtener resumen de pagos
  const { data: misPagos, isLoading: pagosLoading } = useQuery<MisPagosResponse>({
    queryKey: ["mis-pagos-resumen"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/finanzas/mis-pagos?page=1&limit=5")
      return response.data
    },
  })

  // Obtener reservas activas (confirmadas y pendientes)
  const { data: reservasActivas = [], isLoading: reservasLoading } = useQuery<Reserva[]>({
    queryKey: ["reservas-activas"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      const response = await axiosInstance.get("/usuario/reservas?page=1&limit=5")
      const data = response.data
      const reservas = Array.isArray(data) ? data : (data?.data || [])
      // Filtrar solo reservas activas (confirmadas y pendientes) con fecha futura
      const ahora = new Date()
      return reservas.filter((r: Reserva) => {
        const fechaFin = new Date(r.fechaFin)
        return (
          (r.estado === "CONFIRMADA" || r.estado === "PENDIENTE") &&
          fechaFin > ahora
        )
      })
    },
  })

  // Obtener tickets abiertos
  const { data: ticketsAbiertos = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets-abiertos"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain)
      try {
        const response = await axiosInstance.get("/comunicacion/tickets?estado=ABIERTO&page=1&limit=5")
        const data = response.data
        return Array.isArray(data) ? data : (data?.data || [])
      } catch {
        // Si el endpoint no existe, retornar array vacío
        return []
      }
    },
  })

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
    ? misPagos.resumen.vencidas.cantidad === 0 && misPagos.resumen.pendientes.cantidad === 0
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

  // Obtener identificador de unidad
  const getUnidadIdentificador = () => {
    // Primero intentar con unidadInfo (obtenida del endpoint público)
    if (unidadInfo?.identificador) {
      return unidadInfo.identificador
    }
    // Luego intentar con unidad del usuario (si viene en la respuesta)
    if (usuarioInfo?.unidad?.identificador) {
      return usuarioInfo.unidad.identificador
    }
    // Si hay unidadId pero no se pudo obtener la info, mostrar mensaje
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

  if (usuarioLoading || pagosLoading) {
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
  const tieneVencidas = (misPagos?.resumen.vencidas.cantidad || 0) > 0
  const tienePendientes = (misPagos?.resumen.pendientes.cantidad || 0) > 0
  const estadoColor = estaAlDia 
    ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10"
    : tieneVencidas
    ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10"
    : "border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10"

  return (
    <div className="space-y-6 p-6">
      {/* Header con saludo */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {obtenerSaludo()}, {usuarioInfo?.name?.split(" ")[0] || "Usuario"} 👋
        </h1>
        <p className="text-muted-foreground">
          {getUnidadIdentificador()}
        </p>
      </div>

      {/* Saludo y Estado de Facturas */}
      <Card className={cn("border-2", estadoColor)}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            estaAlDia 
              ? "text-green-700 dark:text-green-400"
              : tieneVencidas
              ? "text-red-700 dark:text-red-400"
              : "text-orange-700 dark:text-orange-400"
          )}>
            Estado de Facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {estaAlDia ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 shadow-lg shadow-green-200 dark:shadow-green-900/50">
                    <IconCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-green-700 dark:text-green-400">
                      Estás al día
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
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
                    <p className="font-bold text-lg text-red-700 dark:text-red-400">
                      Tienes facturas vencidas
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {misPagos?.resumen.vencidas.cantidad || 0} vencidas,{" "}
                      {misPagos?.resumen.pendientes.cantidad || 0} pendientes
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 shadow-lg shadow-orange-200 dark:shadow-orange-900/50">
                    <IconAlertCircle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
                  <div>
                    <p className="font-bold text-lg text-orange-700 dark:text-orange-400">
                      Tienes facturas pendientes
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">
                      {misPagos?.resumen.pendientes.cantidad || 0} pendientes de pago
                    </p>
            </div>
                </>
              )}
            </div>
            <Button
              variant={estaAlDia ? "default" : tieneVencidas ? "destructive" : "outline"}
              className={cn(
                estaAlDia && "bg-green-600 hover:bg-green-700 text-white",
                tieneVencidas && "bg-red-600 hover:bg-red-700 text-white",
                tienePendientes && !tieneVencidas && "border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              )}
              onClick={() => router.push("/pagos")}
            >
              Ver Pagos
              <IconArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Próximo Pago */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Pago
            </CardTitle>
            <IconCreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {proximoPago ? (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(proximoPago.valor)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vence: {formatDate(proximoPago.fechaVencimiento)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {proximoPago.numeroFactura}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No hay pagos pendientes
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
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservasActivas.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reservasActivas.length === 1
                ? "Reserva activa"
                : "Reservas activas"}
            </p>
          </CardContent>
        </Card>

        {/* Tickets Abiertos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Abiertos
            </CardTitle>
            <IconTicket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {ticketsAbiertos.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticketsAbiertos.length === 1
                    ? "Ticket abierto"
                    : "Tickets abiertos"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Facturas Pendientes */}
        <Card className={cn(
          "hover:shadow-md transition-shadow",
          tieneVencidas
            ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10"
            : tienePendientes
            ? "border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10"
            : ""
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn(
              "text-sm font-medium",
              tieneVencidas
                ? "text-red-700 dark:text-red-400"
                : tienePendientes
                ? "text-orange-700 dark:text-orange-400"
                : ""
            )}>
              Facturas Pendientes
            </CardTitle>
            <IconReceipt className={cn(
              "h-4 w-4",
              tieneVencidas
                ? "text-red-600 dark:text-red-400"
                : tienePendientes
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              tieneVencidas
                ? "text-red-700 dark:text-red-400"
                : tienePendientes
                ? "text-orange-700 dark:text-orange-400"
                : ""
            )}>
              {misPagos?.resumen.pendientes.cantidad || 0}
            </div>
            <p className={cn(
              "text-xs mt-1",
              tieneVencidas
                ? "text-red-600 dark:text-red-500"
                : tienePendientes
                ? "text-orange-600 dark:text-orange-500"
                : "text-muted-foreground"
            )}>
              Total: {formatCurrency(misPagos?.resumen.pendientes.valor || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reservas Activas y Tickets Abiertos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Reservas Activas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas Activas</CardTitle>
                <CardDescription>
                  Próximas reservas confirmadas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/reservations")}
              >
                Ver todas
                <IconArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reservasLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : reservasActivas.length > 0 ? (
            <div className="space-y-3">
                {reservasActivas.slice(0, 3).map((reserva) => (
                <div
                  key={reserva.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {reserva.espacioComun?.nombre || "Espacio"}
                      </div>
                    <div className="text-sm text-muted-foreground">
                        {formatDateTime(reserva.fechaInicio)} - {formatDateTime(reserva.fechaFin)}
                      </div>
                      {reserva.motivo && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {reserva.motivo}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {getReservaBadge(reserva.estado)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconCalendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes reservas activas</p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/reservations")}
                >
                  Crear Reserva
              </Button>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets Abiertos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tickets Abiertos</CardTitle>
                <CardDescription>
                  Tus solicitudes pendientes
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/comunicacion")}
              >
                Ver todos
                <IconArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : ticketsAbiertos.length > 0 ? (
            <div className="space-y-3">
                {ticketsAbiertos.slice(0, 3).map((ticket) => (
                <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <div className="flex-1">
                      <div className="font-medium">{ticket.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                        {ticket.descripcion?.substring(0, 60)}
                        {ticket.descripcion && ticket.descripcion.length > 60 ? "..." : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getTicketBadge(ticket.estado)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconTicket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes tickets abiertos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de Pagos Recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Últimas facturas y pagos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/pagos")}
            >
              Ver historial completo
              <IconArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pagosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : misPagos && misPagos.facturas.length > 0 ? (
            <div className="space-y-3">
              {misPagos.facturas.slice(0, 5).map((factura) => {
                const isPagada = factura.estado === "PAGADA"
                const isVencida = factura.estado === "VENCIDA"
                const isPendiente = factura.estado === "PENDIENTE"
                
                return (
                  <div
                    key={factura.id}
                    className={cn(
                      "flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md transition-all",
                      isPagada 
                        ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                        : isVencida
                        ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                        : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
                    )}
                  >
                    <div className="flex-1">
                      <div className={cn(
                        "font-semibold",
                        isPagada 
                          ? "text-green-700 dark:text-green-400"
                          : isVencida
                          ? "text-red-700 dark:text-red-400"
                          : "text-orange-700 dark:text-orange-400"
                      )}>
                        {factura.descripcion || factura.numeroFactura}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(factura.fechaVencimiento)}
                    </div>
                  </div>
                  <div className="text-right">
                      <div className={cn(
                        "font-bold",
                        isPagada 
                          ? "text-green-700 dark:text-green-400"
                          : isVencida
                          ? "text-red-700 dark:text-red-400"
                          : "text-orange-700 dark:text-orange-400"
                      )}>
                        {formatCurrency(factura.valor)}
                      </div>
                      <Badge
                        variant={
                          factura.estado === "PAGADA"
                            ? "default"
                            : factura.estado === "VENCIDA"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs mt-1 font-semibold"
                      >
                        {factura.estado}
                      </Badge>
                    </div>
                  </div>
                )
              })}
                </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconReceipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay facturas registradas</p>
            </div>
          )}
          </CardContent>
        </Card>
    </div>
  )
}
