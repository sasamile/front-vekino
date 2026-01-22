"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/middleware/types";
import {
  IconDashboard,
  IconUsers,
  IconCoin,
  IconCalendar,
  IconBuildingCommunity,
  IconFile,
  IconBuilding,
  IconUserCog,
  IconTicket,
  IconHome,
  IconCreditCard,
  IconPackage,
  IconSettings,
  IconHelp,
  IconSearch,
  IconShield,
  type Icon,
} from "@tabler/icons-react";

interface NavItem {
  title: string;
  url: string;
  icon: Icon;
}

// Obtener los primeros 5 enlaces principales según el rol
const getMainNavItems = (role: UserRole): NavItem[] => {
  const basePath =
    role === "PROPIETARIO" ? "/propietario" : role === "ADMIN" ? "/admin" : "/superadmin";

  switch (role) {
    case "PROPIETARIO":
      return [
        {
          title: "Dashboard",
          url: `/`,
          icon: IconDashboard,
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
        {
          title: "Comunidad",
          url: `/comunidad`,
          icon: IconBuildingCommunity,
        },
        {
          title: "Perfil",
          url: `${basePath}/profile`,
          icon: IconHome,
        },
      ];

    case "ADMIN":
      return [
        {
          title: "Dashboard",
          url: `/`,
          icon: IconDashboard,
        },
        {
          title: "Residentes",
          url: `/residentes`,
          icon: IconUsers,
        },
        {
          title: "Finanzas",
          url: `/finanzas`,
          icon: IconCoin,
        },
        {
          title: "Reservas",
          url: `/reservas`,
          icon: IconCalendar,
        },
        {
          title: "Comunidad",
          url: `/comunidad`,
          icon: IconBuildingCommunity,
        },
      ];

    case "SUPERADMIN":
      return [
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
        {
          title: "Planes",
          url: `/planes`,
          icon: IconPackage,
        },
        {
          title: "Reportes",
          url: `/reportes`,
          icon: IconFile,
        },
      ];

    default:
      return [];
  }
};

// Obtener todos los enlaces adicionales (los que no están en los primeros 5)
// Solo incluir rutas que realmente existen en la aplicación
const getAdditionalNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case "PROPIETARIO":
      // No hay enlaces adicionales reales para PROPIETARIO
      return [];

    case "ADMIN":
      // Los primeros 5 son: Dashboard, Residentes, Finanzas, Reservas, Comunidad
      // Los adicionales reales son: Unidades, Espacio Comunal, Tickets, Reportes
      return [
        {
          title: "Unidades",
          url: `/unidades`,
          icon: IconBuilding,
        },
        {
          title: "Espacio Comunal",
          url: `/espacio-comunal`,
          icon: IconBuildingCommunity,
        },
        {
          title: "Tickets",
          url: `/tickets`,
          icon: IconTicket,
        },
        {
          title: "Reportes",
          url: `/reportes`,
          icon: IconFile,
        },
      ];

    case "SUPERADMIN":
      // Todos los enlaces están en los primeros 5, no hay adicionales
      return [];

    default:
      return [];
  }
};

interface MobileBottomNavProps {
  userRole: UserRole;
}

export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname();
  const mainItems = getMainNavItems(userRole);

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-1 gap-x-3">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-[90%] min-w-0 transition-all",
                active
                  ? "bg-primary text-primary-foreground rounded-md mx-1"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary-foreground")} />
              <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Exportar función para obtener enlaces adicionales para el menú de usuario
export function getAdditionalNavItemsForUser(userRole: UserRole): NavItem[] {
  return getAdditionalNavItems(userRole);
}
