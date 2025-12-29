"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  IconCalendar,
  IconCreditCard,
  IconHome,
  IconFileText,
} from "@tabler/icons-react"

// Datos quemados para USER
const mockData = {
  perfil: {
    nombre: "Juan Pérez",
    unidad: "Torre A - 301",
    saldo: 0,
  },
  reservas: [
    {
      id: 1,
      instalacion: "Piscina",
      fecha: "2025-01-15",
      hora: "14:00 - 16:00",
      estado: "confirmada",
    },
    {
      id: 2,
      instalacion: "Salón Social",
      fecha: "2025-01-20",
      hora: "18:00 - 22:00",
      estado: "pendiente",
    },
  ],
  pagos: [
    {
      id: 1,
      concepto: "Administración Enero",
      monto: 250000,
      fecha: "2025-01-05",
      estado: "pagado",
    },
    {
      id: 2,
      concepto: "Administración Febrero",
      monto: 250000,
      fecha: "2025-02-05",
      estado: "pendiente",
    },
  ],
}

export function UserDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
          <CardDescription>Información de tu unidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconHome className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{mockData.perfil.nombre}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {mockData.perfil.unidad}
            </div>
            <div className="text-sm">
              Saldo pendiente:{" "}
              <span className="font-medium">
                ${mockData.perfil.saldo.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis Reservas</CardTitle>
            <CardDescription>Próximas reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{reserva.instalacion}</div>
                    <div className="text-sm text-muted-foreground">
                      {reserva.fecha} • {reserva.hora}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      reserva.estado === "confirmada"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}
                  >
                    {reserva.estado}
                  </span>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Ver todas las reservas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Pagos</CardTitle>
            <CardDescription>Estado de pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{pago.concepto}</div>
                    <div className="text-sm text-muted-foreground">
                      {pago.fecha}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${pago.monto.toLocaleString()}
                    </div>
                    <span
                      className={`text-xs ${
                        pago.estado === "pagado"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {pago.estado}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Ver historial de pagos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

