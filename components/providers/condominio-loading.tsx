"use client";

import { ReactNode, useMemo } from "react";
import { useCondominio } from "./condominio-provider";
import { useSubdomain } from "./subdomain-provider";
import { getCondominioFromStorage } from "@/lib/storage/condominio-storage";

interface CondominioLoadingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que espera a que los datos del condominio estén disponibles
 * antes de renderizar el contenido. Esto evita mostrar el logo de Vekino.
 */
export function CondominioLoading({
  children,
  fallback,
}: CondominioLoadingProps) {
  const { condominio, loading } = useCondominio();
  const { subdomain } = useSubdomain();

  // Verificar si está listo para mostrar contenido
  const isReady = useMemo(() => {
    // Si no hay subdomain, mostrar contenido inmediatamente
    if (!subdomain) {
      return true;
    }

    // Si hay datos en localStorage, está listo inmediatamente
    if (typeof window !== 'undefined') {
      const stored = getCondominioFromStorage(subdomain);
      if (stored) {
        return true;
      }
    }

    // Si la query terminó (ya sea con datos o sin datos), está listo
    if (!loading) {
      return true;
    }

    // Si aún está cargando y no hay datos en localStorage, esperar
    return false;
  }, [subdomain, loading, condominio]);

  // Si no hay subdomain, mostrar contenido inmediatamente
  if (!subdomain) {
    return <>{children}</>;
  }

  // Si aún no está listo, mostrar fallback o nada
  if (!isReady) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse text-muted-foreground">
              Cargando...
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
