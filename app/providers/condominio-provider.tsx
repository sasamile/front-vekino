'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSubdomain } from './subdomain-provider';
import axios from 'axios';

export interface CondominioInfo {
  id: string;
  name: string;
  subdomain: string;
  logo: string | null;
  primaryColor: string;
  nit: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  subscriptionPlan: string | null;
  unitLimit: number | null;
  planExpiresAt: string | null;
  activeModules: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CondominioContextType {
  condominio: CondominioInfo | null;
  loading: boolean;
  error: Error | null;
}

const CondominioContext = createContext<CondominioContextType>({
  condominio: null,
  loading: true,
  error: null,
});

export function useCondominio() {
  return useContext(CondominioContext);
}

export function CondominioProvider({ children }: { children: ReactNode }) {
  const { subdomain } = useSubdomain();

  const {
    data: condominio,
    isLoading: loading,
    error,
  } = useQuery<CondominioInfo | null>({
    queryKey: ['condominio-info', subdomain],
    queryFn: async () => {
      if (!subdomain) {
        return null;
      }

      // Endpoint público - no requiere autenticación
      const baseURL = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
        ? '/api'
        : `https://${subdomain}.vekino.site/api`;
      
      const response = await axios.get(`${baseURL}/condominios/info?subdomain=${subdomain}`, {
        withCredentials: false, // No enviar cookies para endpoint público
      });
      
      return response.data;
    },
    enabled: !!subdomain, // Solo hacer la query si hay subdomain
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Aplicar CSS variables dinámicas para el color primario
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (condominio?.primaryColor) {
      // Convertir el color hex a RGB para usar en CSS variables
      const hex = condominio.primaryColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      root.style.setProperty('--primary', condominio.primaryColor);
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    } else if (!subdomain) {
      // Si no hay subdomain, resetear a valores por defecto (azul)
      root.style.setProperty('--primary', '#3B82F6'); // Azul por defecto
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--primary-rgb', '59, 130, 246');
    }
  }, [condominio?.primaryColor, subdomain]);

  return (
    <CondominioContext.Provider value={{ condominio: condominio || null, loading, error: error as Error | null }}>
      {children}
    </CondominioContext.Provider>
  );
}

