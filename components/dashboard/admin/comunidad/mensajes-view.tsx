"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconMessageCircle,
  IconSearch,
  IconSend,
  IconInfoCircle,
} from "@tabler/icons-react";

interface Conversacion {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  ultimoMensaje?: {
    contenido: string;
    createdAt: string;
  };
  noLeidos: number;
  updatedAt: string;
}

export function MensajesView() {
  const { subdomain } = useSubdomain();
  const [selectedConversacion, setSelectedConversacion] =
    useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Intentar obtener conversaciones (si el endpoint existe)
  const {
    data: conversacionesResponse,
    isLoading,
    error,
  } = useQuery<{ data: Conversacion[] }>({
    queryKey: ["conversaciones", searchQuery],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      try {
        const params = searchQuery
          ? `?search=${encodeURIComponent(searchQuery)}`
          : "";
        const response = await axiosInstance.get(
          `/comunicacion/conversaciones${params}`
        );
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

  const conversaciones = conversacionesResponse?.data || [];

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
      <div className="flex h-full">
        <div className="w-full md:w-80 border-r border-border p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 hidden md:flex items-center justify-center">
          <p className="text-muted-foreground">Selecciona una conversación</p>
        </div>
      </div>
    );
  }

  if (error && conversaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <IconInfoCircle className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Funcionalidad en desarrollo
        </h3>
        <p className="text-muted-foreground">
          Los mensajes estarán disponibles próximamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Lista de conversaciones */}
      <div className="w-full md:w-80 border-r border-border flex flex-col">
        {/* Barra de búsqueda */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
            <Input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {conversaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <IconMessageCircle className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay conversaciones
              </h3>
              <p className="text-muted-foreground">
                Tus conversaciones aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversaciones.map((conversacion) => (
                <div
                  key={conversacion.id}
                  onClick={() => setSelectedConversacion(conversacion.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedConversacion === conversacion.id
                      ? "bg-muted"
                      : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(conversacion.user.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {conversacion.user.name || "Usuario"}
                        </h4>
                        {conversacion.noLeidos > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                            {conversacion.noLeidos}
                          </span>
                        )}
                      </div>
                      {conversacion.ultimoMensaje && (
                        <>
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {conversacion.ultimoMensaje.contenido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(conversacion.ultimoMensaje.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vista de conversación */}
      <div className="flex-1 hidden md:flex flex-col">
        {selectedConversacion ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Conversación</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <IconInfoCircle className="size-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  La vista de mensajes estará disponible próximamente.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                  disabled
                />
                <Button size="icon" disabled>
                  <IconSend className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <IconMessageCircle className="size-16 text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground">
                Selecciona una conversación para ver los mensajes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

