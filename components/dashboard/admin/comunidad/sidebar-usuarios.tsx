"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "./utils";

interface SidebarUsuariosProps {
  usuarios: any[];
  onUserClick: (userId: string, userName: string | null, userImage: string | null) => void;
}

export function SidebarUsuarios({
  usuarios,
  onUserClick,
}: SidebarUsuariosProps) {
  if (usuarios.length === 0) return null;

  return (
    <aside className="hidden lg:flex w-[350px] border-l border-border p-4 overflow-y-auto shrink-0">
      <div className="bg-muted/50 rounded-2xl p-4 mb-6 w-full">
        <h2 className="text-xl font-bold mb-4">Usuarios sugeridos</h2>
        <div className="space-y-4">
          {usuarios.slice(0, 3).map((usuario: any) => (
            <div
              key={usuario.id}
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
              onClick={() => {
                onUserClick(
                  usuario.id,
                  usuario.name || null,
                  usuario.image || null
                );
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  {usuario.image && (
                    <AvatarImage src={usuario.image} alt={usuario.name || "Usuario"} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(usuario.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate max-w-[150px]">
                    {usuario.name || "Usuario"}
                  </div>
                  <div className="text-[13px] text-muted-foreground truncate max-w-[150px]">
                    @{usuario.email?.split("@")[0] || "usuario"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


