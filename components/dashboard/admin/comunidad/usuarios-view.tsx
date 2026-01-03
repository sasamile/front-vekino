"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconSearch,
  IconUserPlus,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

interface Usuario {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  unidadId?: string;
  unidad?: {
    id: string;
    identificador: string;
  };
  createdAt: string;
}

interface UsuariosViewProps {
  onUserClick?: (userId: string, userName: string, userImage: string | null) => void;
}

export function UsuariosView({ onUserClick }: UsuariosViewProps = {} as UsuariosViewProps) {
  const { subdomain } = useSubdomain();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Construir query params
  const queryParams = new URLSearchParams();
  if (searchQuery.trim()) {
    queryParams.append("search", searchQuery.trim());
  }
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  const queryString = queryParams.toString();
  const endpoint = `/comunicacion/usuarios${
    queryString ? `?${queryString}` : ""
  }`;

  // Obtener usuarios
  const {
    data: usuariosResponse,
    isLoading,
    error,
  } = useQuery<
    | Usuario[]
    | {
        data: Usuario[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
  >({
    queryKey: ["usuarios-completo", page, limit, searchQuery],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(endpoint);
      return response.data;
    },
  });

  // Manejar diferentes formatos de respuesta
  let usuarios: Usuario[] = [];
  let total = 0;
  let currentPage = page;
  let totalPages = 0;

  if (usuariosResponse) {
    if (Array.isArray(usuariosResponse)) {
      usuarios = usuariosResponse;
      total = usuariosResponse.length;
      totalPages = 1;
    } else if (usuariosResponse.data && Array.isArray(usuariosResponse.data)) {
      usuarios = usuariosResponse.data;
      total = usuariosResponse.total ?? usuariosResponse.data.length;
      currentPage = usuariosResponse.page ?? page;
      totalPages =
        usuariosResponse.totalPages ?? Math.ceil(total / limit);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
          <Skeleton className="h-10 w-full pl-10" />
        </div>

        {/* Lista de usuarios */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-4 border border-border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <IconUsers className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error al cargar usuarios</h3>
        <p className="text-muted-foreground">
          No se pudieron cargar los usuarios. Por favor, intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
          <Input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="flex-1 overflow-y-auto p-4">
        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IconUsers className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "No se encontraron usuarios con ese criterio de búsqueda."
                : "No hay usuarios registrados en el sistema."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onUserClick) {
                      onUserClick(usuario.id, usuario.name, usuario.image || null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      {usuario.image && (
                        <AvatarImage src={usuario.image} alt={usuario.name || "Usuario"} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(usuario.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate">
                      {usuario.name || "Usuario"}
                    </div>
                    <div className="text-[13px] text-muted-foreground truncate">
                      {usuario.email}
                    </div>
                    {usuario.unidad && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Unidad: {usuario.unidad.identificador}
                      </div>
                    )}
                  </div>
                </div>
             
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {usuarios.length} de {total} usuarios
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

