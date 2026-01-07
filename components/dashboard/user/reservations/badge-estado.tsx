"use client";

import { Badge } from "@/components/ui/badge";
import {
  IconCheck,
  IconClock,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import type { ReservaEstado } from "@/types/types";

export function BadgeEstado({ estado }: { estado: ReservaEstado }) {
  const variants: Record<
    ReservaEstado,
    { variant: "default" | "destructive" | "secondary"; label: string; icon: any }
  > = {
    CONFIRMADA: {
      variant: "default",
      label: "Confirmada",
      icon: IconCheck,
    },
    PENDIENTE: {
      variant: "secondary",
      label: "Pendiente",
      icon: IconClock,
    },
    CANCELADA: {
      variant: "destructive",
      label: "Cancelada",
      icon: IconX,
    },
    COMPLETADA: {
      variant: "default",
      label: "Completada",
      icon: IconCheck,
    },
  };
  
  const config = variants[estado] || {
    variant: "secondary" as const,
    label: estado,
    icon: IconAlertCircle,
  };
  
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}


