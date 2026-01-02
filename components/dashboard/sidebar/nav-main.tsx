"use client"

import { useState } from "react"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CreateCondominioDialog } from "./create-condominio-dialog"
import type { UserRole } from "@/lib/middleware/types"

export function NavMain({
  items,
  userRole,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  userRole: UserRole
}) {
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          {userRole === "SUPERADMIN" && (
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2 ">
                <SidebarMenuButton
                  tooltip="Crear Condominio"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear cursor-pointer"
                  onClick={() => setDialogOpen(true)}
                >
                  <IconCirclePlusFilled />
                  <span>Crear Condomino</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
    
    <CreateCondominioDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    />
    </>
  )
}

