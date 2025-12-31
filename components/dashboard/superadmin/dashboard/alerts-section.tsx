"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Alerta } from "@/types/types";
import { AlertTenantsDialog } from "./alert-tenants-dialog";

interface AlertsSectionProps {
  alertas: Alerta[];
  isLoading?: boolean;
}

export function AlertsSection({
  alertas,
  isLoading = false,
}: AlertsSectionProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewDetails = (alerta: Alerta) => {
    setSelectedAlert(alerta);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Alertas y Riesgos</CardTitle>
          <CardDescription>
            Situaciones que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay alertas en este momento
            </div>
          ) : (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(alerta)}
                  >
                    Ver detalles
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertTenantsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={selectedAlert?.mensaje || ""}
        tenants={selectedAlert?.tenants}
      />
    </>
  );
}

