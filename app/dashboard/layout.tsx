import React from 'react'
import { headers } from 'next/headers'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SiteHeader } from '@/components/dashboard/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import type { UserRole } from '@/lib/middleware/types'

async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  
  // Obtener información del usuario desde los headers que el middleware agregó
  const userRole = (headersList.get('x-user-role') || 'USER') as UserRole
  const userId = headersList.get('x-user-id') || ''
  const userEmail = headersList.get('x-user-email') || ''
  const userName = headersList.get('x-user-name') || userEmail.split('@')[0] || 'Usuario'

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        variant="inset"
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayout
