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
  IconBuildingCommunity,
  IconCoin,
  IconFile,
  IconUser,
  IconTicket,
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
    role === "PROPIETARIO" ? "/propietario" : role === "ADMIN" ? "/admin" : "/superadmin";

  switch (role) {
    case "PROPIETARIO":
      return {
        navMain: [
          {
            title: "Dashboard",
            url: `/dashboard`,
            icon: IconDashboard,
          },
          {
            title: "Mi Perfil",
            url: `${basePath}/profile`,
            icon: IconHome,
          },
          {
            title: "Reservas",
            url: `/reservations`,
            icon: IconCalendar,
          },
          {
            title: "Pagos",
            url: `/pagos`,
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
            url: `/`,
            icon: IconDashboard,
          },
          {
            title: "Unidades",
            url: `/unidades`,
            icon: IconBuilding,
          },
          {
            title: "Residentes",
            url: `/residentes`,
            icon: IconUsers,
          },
          {
            title: "Espacio Comunal",
            url: `/espacio-comunal`,
            icon: IconBuildingCommunity,
          },
          {
            title: "Reservas",
            url: `/reservas`,
            icon: IconCalendar,
          },
          {
            title: "Finanzas",
            url: `/finanzas`,
            icon: IconCoin,
          },
          {
            title: "Comunidad",
            url: `/comunidad`,
            icon: IconUser,
          },
          {
            title: "Tickets",
            url: `/tickets`,
            icon: IconTicket,
          },
        ],
        navSecondary: [
          {
            title: "Configuración",
            url: `${basePath}/settings`,
            icon: IconSettings,
          },
          {
            title: "Reportes",
            url: `/reportes`,
            icon: IconFile,
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

export function  AppSidebar({
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
        <NavMain items={navConfig.navMain} userRole={userRole} />
        <NavSecondary items={navConfig.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            image: userAvatar,
            name: userName,
            email: userEmail,
            avatar: userAvatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
