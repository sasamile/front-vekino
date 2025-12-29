'use client';

import { getDomains } from '@/actions/subdomain';
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
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener el subdominio del hostname
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

    // Obtener la lista de dominios disponibles usando server action
    const fetchDomains = async () => {
      try {
        const domainsList = await getDomains();
        setDomains(domainsList);
      } catch (error) {
        console.error('Error al obtener dominios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  return (
    <SubdomainContext.Provider value={{ subdomain, domains, loading }}>
      {children}
    </SubdomainContext.Provider>
  );
}

