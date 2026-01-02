import React from "react";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/middleware/types";
import { CondominioSiteHeader } from "@/components/dashboard/sidebar/condominio-site-header";

async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  // Obtener información del usuario desde los headers que el middleware agregó
  const userRole = (headersList.get("x-user-role") || "USER") as UserRole;
  const userId = headersList.get("x-user-id") || "";
  const userEmail = headersList.get("x-user-email") || "";
  const userAvatar = headersList.get("x-user-image") || "";
  const userName =
    headersList.get("x-user-name") || userEmail.split("@")[0] || "Usuario";

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        userAvatar={userAvatar}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <CondominioSiteHeader userRole={userRole} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardLayout;
