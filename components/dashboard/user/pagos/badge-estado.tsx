"use client";

import { Badge } from "@/components/ui/badge";
import type { FacturaEstado } from "@/types/types";

export function BadgeEstado({ estado }: { estado: FacturaEstado }) {
  const variants: Record<
    FacturaEstado,
    { variant: "default" | "destructive" | "secondary"; label: string; className?: string }
  > = {
    PAGADA: { variant: "default", label: "Pagada" },
    PENDIENTE: { variant: "secondary", label: "Pendiente" },
    ENVIADA: { variant: "secondary", label: "Enviada" },
    ABONADO: { variant: "default", label: "Abonado", className: "bg-green-600 hover:bg-green-700 text-white" },
    VENCIDA: { variant: "destructive", label: "Vencida" },
    CANCELADA: { variant: "secondary", label: "Cancelada" },
  };

  const config = variants[estado] || {
    variant: "secondary" as const,
    label: estado,
  };

  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
}

