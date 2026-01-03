"use client";

import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBell,
  IconMessageCircle,
  IconHeart,
  IconUserPlus,
  IconInfoCircle,
} from "@tabler/icons-react";

interface Notificacion {
  id: string;
  tipo: "POST" | "COMENTARIO" | "REACCION" | "SEGUIMIENTO" | "OTRO";
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function NotificacionesView() {
  const { subdomain } = useSubdomain();

  // Intentar obtener notificaciones (si el endpoint existe)
  const {
    data: notificacionesResponse,
    isLoading,
    error,
  } = useQuery<{ data: Notificacion[] }>({
    queryKey: ["notificaciones"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      try {
        const response = await axiosInstance.get("/comunicacion/notificaciones");
        return response.data;
      } catch (error: any) {
        // Si el endpoint no existe, retornar array vacío
        if (error?.response?.status === 404) {
          return { data: [] };
        }
        throw error;
      }
    },
    retry: false,
  });

  const notificaciones = notificacionesResponse?.data || [];

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "POST":
        return <IconMessageCircle className="size-5" />;
      case "COMENTARIO":
        return <IconMessageCircle className="size-5" />;
      case "REACCION":
        return <IconHeart className="size-5" />;
      case "SEGUIMIENTO":
        return <IconUserPlus className="size-5" />;
      default:
        return <IconBell className="size-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-4 border border-border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && notificaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <IconInfoCircle className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Funcionalidad en desarrollo
        </h3>
        <p className="text-muted-foreground">
          Las notificaciones estarán disponibles próximamente.
        </p>
      </div>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <IconBell className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
        <p className="text-muted-foreground">
          Cuando tengas nuevas notificaciones, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {notificaciones.map((notificacion) => (
        <div
          key={notificacion.id}
          className={`flex gap-3 p-4 rounded-lg transition-colors cursor-pointer ${
            notificacion.leida
              ? "bg-background border border-border hover:bg-muted/50"
              : "bg-muted border border-primary/20 hover:bg-muted/80"
          }`}
        >
          <div className="shrink-0">
            {notificacion.user ? (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(notificacion.user.name || "U")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getIcon(notificacion.tipo)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 truncate">
                  {notificacion.titulo}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notificacion.mensaje}
                </p>
              </div>
              {!notificacion.leida && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDate(notificacion.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

