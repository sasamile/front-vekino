"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconBuilding,
  IconTrendingUp,
} from "@tabler/icons-react"

// Datos quemados para ADMIN
const mockData = {
  resumen: {
    usuarios: 125,
    reservasPendientes: 12,
    instalaciones: 5,
    ingresosMes: 4500000,
  },
  reservasRecientes: [
    {
      id: 1,
      instalacion: "Piscina",
      usuario: "Juan Pérez",
      fecha: "2025-01-10",
      estado: "pendiente",
    },
    {
      id: 2,
      instalacion: "Salón Social",
      usuario: "María García",
      fecha: "2025-01-11",
      estado: "confirmada",
    },
  ],
}

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.resumen.usuarios}</div>
            <p className="text-xs text-muted-foreground">
              Total de residentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas Pendientes
            </CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockData.resumen.reservasPendientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockData.resumen.instalaciones}
            </div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockData.resumen.ingresosMes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">COP</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
          <CardDescription>
            Últimas reservas que requieren atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockData.reservasRecientes.map((reserva) => (
              <div
                key={reserva.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{reserva.instalacion}</div>
                  <div className="text-sm text-muted-foreground">
                    {reserva.usuario} • {reserva.fecha}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

