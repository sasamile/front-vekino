"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconHome,
  IconSearch,
  IconBell,
  IconCirclePlusFilled,
  IconUsers,
} from "@tabler/icons-react";
import { getInitials } from "./utils";

type ActiveMenu = "inicio" | "explorar" | "notificaciones" | "mensajes" | "usuarios";

interface SidebarNavegacionProps {
  activeMenu: ActiveMenu;
  onMenuChange: (menu: ActiveMenu) => void;
  onCreatePost: () => void;
  currentUser: any;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
}

export function SidebarNavegacion({
  activeMenu,
  onMenuChange,
  onCreatePost,
  currentUser,
  sidebarOpen,
  onSidebarClose,
}: SidebarNavegacionProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onSidebarClose}
        />
      )}

      {/* Sidebar Izquierdo */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[275px] border-r border-border flex-col shrink-0 bg-background transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo/Navegación */}
        <div className="p-4 h-full flex flex-col">
          {/* Menú de navegación */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                onMenuChange("inicio");
                onSidebarClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "inicio"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconHome className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Inicio</span>
            </button>
            <button
              onClick={() => {
                onMenuChange("explorar");
                onSidebarClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "explorar"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconSearch className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Explorar</span>
            </button>
            <button
              onClick={() => {
                onMenuChange("notificaciones");
                onSidebarClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "notificaciones"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconBell className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">
                Notificaciones
              </span>
            </button>
            <button
              onClick={() => {
                onMenuChange("usuarios");
                onSidebarClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "usuarios"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconUsers className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Usuarios</span>
            </button>
          </nav>

          {/* Botón Publicar */}
          <Button
            onClick={onCreatePost}
            className="w-full mt-4 rounded-full h-12 text-[15px] font-semibold"
            size="lg"
          >
            <IconCirclePlusFilled className="size-5 mr-2" />
            Publicar
          </Button>
        </div>

        {/* Perfil del usuario en la parte inferior */}
        <div className="mt-auto p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-muted transition-colors cursor-pointer">
            <Avatar className="h-10 w-10 shrink-0">
              {currentUser?.image && (
                <AvatarImage src={currentUser.image} alt={currentUser.name || "Usuario"} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {currentUser
                  ? getInitials(currentUser.name || currentUser.email || "U")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] truncate">
                {currentUser?.name ||
                  currentUser?.email?.split("@")[0] ||
                  "Usuario"}
              </div>
              <div className="text-[13px] text-muted-foreground truncate">
                @{currentUser?.email?.split("@")[0] || "usuario"}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


