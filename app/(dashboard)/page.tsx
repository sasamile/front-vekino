import React from "react"
import { headers } from "next/headers"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import type { UserRole } from "@/lib/middleware/types"
import { SuperAdminDashboard } from "@/components/dashboard/superadmin/dashboard/superadmin-dashboard"
import GuardiaSeguridadDashboard from "@/components/dashboard/guardia/dashboard-seguridad"

async function DashboardPage() {
  const headersList = await headers()

  // Obtener el rol del usuario desde los headers
  const userRole = (headersList.get("x-user-role") || "USER") as UserRole

  // Renderizar el dashboard según el rol
  switch (userRole) {
    case "SUPERADMIN":
      return <SuperAdminDashboard />
    case "ADMIN":
      return <AdminDashboard />
    case "PROPIETARIO":
      return <UserDashboard />
    case "GUARDIA_SEGURIDAD":
      return <GuardiaSeguridadDashboard />
    default:
      return <UserDashboard />
  }
}

export default DashboardPage