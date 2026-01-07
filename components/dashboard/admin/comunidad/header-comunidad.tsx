"use client";

import { IconMenu2 } from "@tabler/icons-react";

type ActiveMenu = "inicio" | "explorar" | "notificaciones" | "mensajes" | "usuarios";

interface HeaderComunidadProps {
  activeMenu: ActiveMenu;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const menuTitles: Record<ActiveMenu, string> = {
  inicio: "Inicio",
  explorar: "Explorar",
  notificaciones: "Notificaciones",
  mensajes: "Mensajes",
  usuarios: "Usuarios",
};

export function HeaderComunidad({
  activeMenu,
  sidebarOpen,
  onSidebarToggle,
}: HeaderComunidadProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
        >
          <IconMenu2 className="size-5" />
        </button>
        <h1 className="text-xl font-bold truncate">
          {menuTitles[activeMenu]}
        </h1>
      </div>
    </div>
  );
}


