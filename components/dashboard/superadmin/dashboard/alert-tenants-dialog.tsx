"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBuilding, IconClock, IconAlertTriangle } from "@tabler/icons-react";
import type { AlertTenant } from "@/types/types";

interface AlertTenantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tenants: AlertTenant[] | undefined;
}

export function AlertTenantsDialog({
  open,
  onOpenChange,
  title,
  tenants = [],
}: AlertTenantsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Listado de condominios relacionados con esta alerta
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay condominios relacionados
            </div>
          ) : (
            tenants.map((tenant) => {
              const isExpired = tenant.daysUntilExpiration < 0;
              const isExpiringSoon = tenant.daysUntilExpiration <= 7 && tenant.daysUntilExpiration >= 0;

              return (
                <div
                  key={tenant.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <IconBuilding className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {tenant.subdomain}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                        <IconAlertTriangle className="w-4 h-4" />
                        <span>
                          Vencido hace {Math.abs(tenant.daysUntilExpiration)} día
                          {Math.abs(tenant.daysUntilExpiration) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ) : isExpiringSoon ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                        <IconClock className="w-4 h-4" />
                        <span>
                          {tenant.daysUntilExpiration} día
                          {tenant.daysUntilExpiration !== 1 ? "s" : ""} restante
                          {tenant.daysUntilExpiration !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconClock className="w-4 h-4" />
                        <span>
                          {tenant.daysUntilExpiration} día
                          {tenant.daysUntilExpiration !== 1 ? "s" : ""} restante
                          {tenant.daysUntilExpiration !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

