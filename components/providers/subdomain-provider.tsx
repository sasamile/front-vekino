'use client';

import { getDomains } from '@/actions/subdomain';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SubdomainContextType {
  subdomain: string | null;
  domains: string[];
  loading: boolean;
}

const SubdomainContext = createContext<SubdomainContextType>({
  subdomain: null,
  domains: [],
  loading: true,
});

export function useSubdomain() {
  return useContext(SubdomainContext);
}

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Obtener el subdominio del hostname
  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Detectar si es localhost (desarrollo) o dominio de producción
    const isLocalhost = hostname.includes('localhost');
    let detectedSubdomain: string | null = null;
    
    if (isLocalhost) {
      // Para localhost: condominio.localhost:3000 -> condominio
      const parts = hostname.split('.');
      if (parts.length > 1 && parts[0] !== 'localhost') {
        detectedSubdomain = parts[0];
      }
    } else {
      // Para producción: condominio.vekino.site -> condominio
      // vekino.site -> null (sin subdominio)
      const parts = hostname.split('.');
      if (parts.length > 2) {
        // Si tiene más de 2 partes, la primera es el subdominio
        detectedSubdomain = parts[0];
      }
    }
    
    if (detectedSubdomain) {
      setSubdomain(detectedSubdomain);
    }
  }, []);

  // Usar React Query para obtener dominios con refetch automático
  const {
    data: domains = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['domains'],
    queryFn: getDomains,
    // Refetch cada 5 minutos para obtener nuevos dominios
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    // Mantener los datos en cache por 5 minutos
    staleTime: 5 * 60 * 1000,
    // Mantener los datos en cache incluso cuando no hay suscriptores
    gcTime: 10 * 60 * 1000, // 10 minutos
    // Reintentar automáticamente en caso de error (solo 1 vez para evitar bloqueos)
    retry: 1,
    retryDelay: 2000, // 2 segundos entre reintentos
    // No bloquear la UI si falla - usar datos en cache o array vacío
    refetchOnWindowFocus: false,
    // No fallar silenciosamente, pero no bloquear el renderizado
    throwOnError: false,
  });

  return (
    <SubdomainContext.Provider value={{ subdomain, domains, loading }}>
      {children}
    </SubdomainContext.Provider>
  );
}

