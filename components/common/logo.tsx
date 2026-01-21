"use client";

import { useCondominio } from "@/components/providers/condominio-provider";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getCondominioFromStorage } from "@/lib/storage/condominio-storage";
import { useEffect, useState } from "react";

interface LogoProps {
  showTitle?: boolean;
}

function Logo({ showTitle = true }: LogoProps) {
  const { condominio } = useCondominio();
  const { subdomain } = useSubdomain();
  
  // Estado para logo desde localStorage (para evitar flash)
  const [storedLogo, setStoredLogo] = useState<string | null>(null);
  const [storedName, setStoredName] = useState<string | null>(null);

  useEffect(() => {
    if (subdomain && typeof window !== 'undefined') {
      const stored = getCondominioFromStorage(subdomain);
      if (stored) {
        setStoredLogo(stored.logo);
        setStoredName(stored.name);
      }
    }
  }, [subdomain]);

  // Prioridad: condominio de query > localStorage > default
  const logo = condominio?.logo || storedLogo;
  const name = condominio?.name || storedName;

  // Si hay subdomain, priorizar logo del condominio; si no, usar logo general
  if (subdomain) {
    // Si hay logo (de query o localStorage), usar el logo del condominio
    if (logo) {
      return (
        <div className="flex items-center justify-center gap-2">
          <img
            src={logo}
            alt={name || "Logo"}
            className="h-8 w-auto object-contain rounded-2xl"
          />
          {showTitle && name && (
            <div>
              <span className="text-xs uppercase font-bold">
                {name}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Si hay subdomain pero no hay logo, usar el logo principal de Vekino (sin texto para evitar parpadeo)
    return (
      <div className="flex items-center justify-center gap-2">
        <img
          src="/logos/large-vekino-logo.png"
          alt="Vekino Platform"
          className="h-8 w-auto object-contain"
        />
      </div>
    );
  }

  // Si NO hay subdomain, usar siempre el logo principal de Vekino, sin texto
  return (
    <div className="flex items-center justify-center gap-2">
      <img
        src="/logos/large-vekino-logo.png"
        alt="Vekino Platform"
        className="h-auto w-36 object-contain"
      />
    </div>
  );
}

export default Logo;
