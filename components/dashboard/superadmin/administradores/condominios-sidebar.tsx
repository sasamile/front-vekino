"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconSearch, IconBuilding } from "@tabler/icons-react";
import type { Condominio } from "@/types/types";
import type { PaginatedResponse } from "@/types/condominios";
import { cn } from "@/lib/utils";

interface CondominiosSidebarProps {
  selectedCondominioId: string | null;
  onSelectCondominio: (condominioId: string) => void;
  withoutCard?: boolean;
}

export function CondominiosSidebar({
  selectedCondominioId,
  onSelectCondominio,
  withoutCard = false,
}: CondominiosSidebarProps) {
  const { subdomain } = useSubdomain();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: response, isLoading } = useQuery<PaginatedResponse<Condominio>>({
    queryKey: ["condominios"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios");
      return response.data;
    },
  });

  const condominios = response?.data || [];

  const filteredCondominios = condominios.filter((condominio) =>
    condominio.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seleccionar por defecto el primer condominio disponible si no hay uno seleccionado
  useEffect(() => {
    if (!isLoading && !selectedCondominioId && filteredCondominios.length > 0) {
      onSelectCondominio(filteredCondominios[0].id);
    }
  }, [isLoading, selectedCondominioId, filteredCondominios, onSelectCondominio]);

  const total = filteredCondominios.length;

  const listContent = (
    <>
      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCondominios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <IconBuilding className="size-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? "No se encontraron condominios"
              : "No hay condominios disponibles"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-2">
          {filteredCondominios.map((condominio) => (
            <button
              key={condominio.id}
              onClick={() => onSelectCondominio(condominio.id)}
              className={cn(
                "w-full p-4 text-left transition-all",
                selectedCondominioId === condominio.id
                  ? "bg-primary/10 ring-2 ring-primary/40 rounded-xl shadow-sm"
                  : "hover:bg-accent rounded-xl"
              )}
            >
              <div className="flex items-center gap-2">
                {condominio.logo ? (
                  <div
                    className="size-10 rounded-lg overflow-hidden border-2 shadow-sm shrink-0"
                    style={{
                      borderColor: condominio.primaryColor || "#3B82F6",
                    }}
                  >
                    <img
                      src={condominio.logo}
                      alt={condominio.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: ${condominio.primaryColor || "#3B82F6"}">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="size-10 rounded-lg overflow-hidden border-2 shadow-sm bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: condominio.primaryColor || "#3B82F6",
                    }}
                  >
                    <IconBuilding
                      className="size-5"
                      style={{ color: condominio.primaryColor || "#3B82F6" }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{condominio.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <span>{condominio.city}</span>
                    {condominio.country && <span className="opacity-70">• {condominio.country}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (withoutCard) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Condominios</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {isLoading ? "Cargando..." : `${total} en lista`}
            </span>
          </div>
          <div className="relative mt-2">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Buscar condominio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {listContent}
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col max-h-[calc(100vh-12rem)] border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Condominios</CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {isLoading ? "Cargando..." : `${total} en lista`}
          </span>
        </div>
        <div className="relative mt-3">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Buscar condominio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 px-2 pb-3">
        {listContent}
      </CardContent>
    </Card>
  );
}
