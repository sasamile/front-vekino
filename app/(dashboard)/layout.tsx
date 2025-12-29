import React from "react";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/lib/middleware/types";
import { SiteHeader } from "@/components/dashboard/sidebar/site-header";

async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  // Obtener información del usuario desde los headers que el middleware agregó
  const userRole = (headersList.get("x-user-role") || "USER") as UserRole;
  const userId = headersList.get("x-user-id") || "";
  const userEmail = headersList.get("x-user-email") || "";
  const userName =
    headersList.get("x-user-name") || userEmail.split("@")[0] || "Usuario";

  // Título del dashboard según el rol
  const dashboardTitle =
    userRole === "SUPERADMIN"
      ? "Panel de Control"
      : userRole === "ADMIN"
      ? "Dashboard Administrativo"
      : "Mi Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <SiteHeader title={dashboardTitle} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardLayout;
