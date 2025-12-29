"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Alerta } from "@/types/types";

interface AlertsSectionProps {
  alertas: Alerta[];
}

export function AlertsSection({ alertas }: AlertsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas y Riesgos</CardTitle>
        <CardDescription>
          Situaciones que requieren atención inmediata
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alerta.severidad === "alta"
                  ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  : alerta.severidad === "media"
                  ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
                  : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
              }`}
            >
              <IconAlertTriangle
                className={`h-5 w-5 ${
                  alerta.severidad === "alta"
                    ? "text-red-600"
                    : alerta.severidad === "media"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              />
              <p className="flex-1 text-sm">{alerta.mensaje}</p>
              <Button variant="ghost" size="sm">
                Ver detalles
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

