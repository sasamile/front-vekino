"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBuilding,
  IconShield,
  IconUserCog,
  IconHome,
  IconCreditCard,
  IconCalendar,
  type Icon,
} from "@tabler/icons-react";

import Logo from "@/components/common/logo";
import { NavMain } from "@/components/dashboard/sidebar/nav-main";
import { NavSecondary } from "@/components/dashboard/sidebar/nav-secondary";
import { NavUser } from "@/components/dashboard/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/middleware/types";

interface NavItem {
  title: string;
  url: string;
  icon: Icon;
}

// Configuración de navegación por rol
const getNavConfig = (
  role: UserRole
): {
  navMain: NavItem[];
  navSecondary: NavItem[];
} => {
  const basePath =
    role === "USER" ? "/user" : role === "ADMIN" ? "/admin" : "/superadmin";

  switch (role) {
    case "USER":
      return {
        navMain: [
          {
            title: "Dashboard",
            url: `${basePath}/dashboard`,
            icon: IconDashboard,
          },
          {
            title: "Mi Perfil",
            url: `${basePath}/profile`,
            icon: IconHome,
          },
          {
            title: "Reservas",
            url: `${basePath}/reservations`,
            icon: IconCalendar,
          },
          {
            title: "Pagos",
            url: `${basePath}/payments`,
            icon: IconCreditCard,
          },
        ],
        navSecondary: [
          {
            title: "Configuración",
            url: `${basePath}/settings`,
            icon: IconSettings,
          },
          {
            title: "Ayuda",
            url: `${basePath}/help`,
            icon: IconHelp,
          },
          {
            title: "Buscar",
            url: `${basePath}/search`,
            icon: IconSearch,
          },
        ],
      };

    case "ADMIN":
      return {
        navMain: [
          {
            title: "Dashboard",
            url: `${basePath}/dashboard`,
            icon: IconDashboard,
          },
          {
            title: "Resumen",
            url: `${basePath}/overview`,
            icon: IconChartBar,
          },
          {
            title: "Usuarios",
            url: `${basePath}/users`,
            icon: IconUsers,
          },
          {
            title: "Reservas",
            url: `${basePath}/reservations`,
            icon: IconCalendar,
          },
          {
            title: "Instalaciones",
            url: `${basePath}/facilities`,
            icon: IconBuilding,
          },
        ],
        navSecondary: [
          {
            title: "Configuración",
            url: `${basePath}/settings`,
            icon: IconSettings,
          },
          {
            title: "Ayuda",
            url: `${basePath}/help`,
            icon: IconHelp,
          },
          {
            title: "Buscar",
            url: `${basePath}/search`,
            icon: IconSearch,
          },
        ],
      };

    case "SUPERADMIN":
      return {
        navMain: [
          {
            title: "Dashboard",
            url: `/`,
            icon: IconDashboard,
          },
          {
            title: "Condominios",
            url: `/condominios`,
            icon: IconBuilding,
          },
          {
            title: "Administradores",
            url: `/administradores`,
            icon: IconUserCog,
          },
        ],
        navSecondary: [
          {
            title: "Planes",
            url: `/planes`,
            icon: IconSettings,
          },
          {
            title: "Seguridad",
            url: `${basePath}/security`,
            icon: IconShield,
          },
          {
            title: "Ayuda",
            url: `${basePath}/help`,
            icon: IconHelp,
          },
          {
            title: "Buscar",
            url: `${basePath}/search`,
            icon: IconSearch,
          },
        ],
      };

    default:
      return {
        navMain: [],
        navSecondary: [],
      };
  }
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function AppSidebar({
  userRole,
  userName = "Usuario",
  userEmail = "",
  userAvatar,
  ...props
}: AppSidebarProps) {
  const navConfig = getNavConfig(userRole);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <Logo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navConfig.navMain} />
        <NavSecondary items={navConfig.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userName,
            email: userEmail,
            avatar: userAvatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
