"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useCondominio } from "@/app/providers/condominio-provider"
import type { UserRole } from "@/lib/middleware/types"

interface CondominioSiteHeaderProps {
  userRole: UserRole;
  defaultTitle?: string;
}

export function CondominioSiteHeader({ userRole, defaultTitle }: CondominioSiteHeaderProps) {
  const { condominio } = useCondominio();

  // Título del dashboard según el rol y condominio
  let title = defaultTitle;
  if (!title) {
    if (userRole === "SUPERADMIN") {
      title = "Panel de Control";
    } else if (userRole === "ADMIN") {
      title = condominio?.name || "Dashboard Administrativo";
    } else {
      title = condominio?.name || "Mi Dashboard";
    }
  }

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}

