"use client";

import { useState } from "react";
import { IconBuilding } from "@tabler/icons-react";

interface CondominioLogoProps {
  logo: string | null;
  name: string;
  primaryColor: string;
}

export function CondominioLogo({ logo, name, primaryColor }: CondominioLogoProps) {
  const [imageError, setImageError] = useState(false);

  if (!logo || imageError) {
    return (
      <div
        className="size-16 rounded-xl overflow-hidden border-2 shadow-md bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center"
        style={{
          borderColor: primaryColor || "#3B82F6",
        }}
      >
        <IconBuilding
          className="size-8"
          style={{ color: primaryColor || "#3B82F6" }}
        />
      </div>
    );
  }

  return (
    <div
      className="size-16 rounded-xl overflow-hidden border-2 shadow-md"
      style={{
        borderColor: primaryColor || "#3B82F6",
      }}
    >
      <img
        src={logo}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

