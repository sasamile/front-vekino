"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
  IconPackage,
} from "@tabler/icons-react";
import type { UserRole } from "@/lib/middleware/types";
import Logo from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconBell, IconUser, IconLogout } from "@tabler/icons-react";
import toast from "react-hot-toast";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case "PROPIETARIO":
      return [
        {
          title: "Dashboard",
          url: "/",
          icon: IconDashboard,
        },
        {
          title: "Reservas",
          url: "/reservations",
          icon: IconCalendar,
        },
        {
          title: "Pagos",
          url: "/pagos",
          icon: IconCoin,
        },
        {
          title: "Comunidad",
          url: "/comunidad",
          icon: IconBuildingCommunity,
        },
      ];

    case "ADMIN":
      return [
        {
          title: "Dashboard",
          url: "/",
          icon: IconDashboard,
        },
        {
          title: "Residentes",
          url: "/residentes",
          icon: IconUsers,
        },
        {
          title: "Finanzas",
          url: "/finanzas",
          icon: IconCoin,
        },
        {
          title: "Reservas",
          url: "/reservas",
          icon: IconCalendar,
        },
        {
          title: "Comunicación",
          url: "/comunidad",
          icon: IconBuildingCommunity,
        },
        {
          title: "Reportes",
          url: "/reportes",
          icon: IconFile,
        },
        // {
        //   title: "Planes",
        //   url: "/planes",
        //   icon: IconPackage,
        // },
      ];

    case "SUPERADMIN":
      return [
        {
          title: "Dashboard",
          url: "/",
          icon: IconDashboard,
        },
        {
          title: "Condominios",
          url: "/condominios",
          icon: IconBuilding,
        },
        {
          title: "Administradores",
          url: "/administradores",
          icon: IconUserCog,
        },
        {
          title: "Planes",
          url: "/planes",
          icon: IconPackage,
        },
      ];

    default:
      return [];
  }
};

interface TopNavigationProps {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  condominioName?: string;
}

export function TopNavigation({
  userRole,
  userName = "Usuario",
  userEmail = "",
  condominioName,
}: TopNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { subdomain } = useSubdomain();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navItems = getNavItems(userRole);

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post("/logout");
      toast.success("Sesión cerrada");
      router.push("/auth/login");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Error al cerrar sesión";
      toast.error(errorMessage);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="top-0 z-50 bg-background max-w-7xl mx-auto px-2 sm:px-6">
      {/* Header superior con logo y menú de usuario */}
      <div className="border-b pt-4 max-sm:px-4">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          {/* Espaciador */}
          <div className="flex-1" />

          {/* Right side - Condominio name and user menu */}
          <div className="flex items-center gap-4">
            {condominioName && userRole !== "SUPERADMIN" && (
              <div className="text-sm text-muted-foreground border-r pr-4">
                Vista:{" "}
                <span className="font-semibold text-foreground">
                  {condominioName}
                </span>
              </div>
            )}

            {/* Notifications */}
            {/* <Button variant="ghost" size="icon" className="relative">
              <IconBell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button> */}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconUser className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconUser className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <IconLogout className="mr-2 h-4 w-4" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left"
                    disabled={isLoggingOut}
                  >
                    Cerrar sesión
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Barra de navegación con tabs */}
      <div className="py-4 max-sm:px-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <ScrollArea>
          <nav className="flex items-center gap-1 h-12 max-w-7xl mx-auto px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.url);

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
