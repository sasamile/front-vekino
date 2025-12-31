"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { IconCheck, IconX, IconBuilding } from "@tabler/icons-react";
import type { Tenant } from "@/types/types";

interface ViewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export function ViewTenantDialog({
  open,
  onOpenChange,
  tenant,
}: ViewTenantDialogProps) {
  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Tenant</DialogTitle>
          <DialogDescription>
            Información completa del condominio seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-4 pb-4 border-b">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.nombre}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconBuilding className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold">{tenant.nombre}</h3>
              <p className="text-muted-foreground">
                {tenant.subdominio}.vekino.site
              </p>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    tenant.estado === "activo"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {tenant.estado === "activo" ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconX className="size-3.5" />
                  )}
                  {tenant.estado}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <p className="text-sm font-medium">{tenant.plan}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Uso de Unidades</Label>
              <p className="text-sm font-medium">
                {tenant.unidades.usadas} / {tenant.unidades.limite}
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      (tenant.unidades.usadas / tenant.unidades.limite) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vencimiento del Plan</Label>
              <p className="text-sm font-medium">{tenant.vencimiento}</p>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ubicación</Label>
            <div className="space-y-1">
              <p className="text-sm font-medium">{tenant.ciudad}</p>
              <p className="text-sm text-muted-foreground">{tenant.pais}</p>
            </div>
          </div>

          {/* Módulos */}
          {tenant.modulos && tenant.modulos.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Módulos Activos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tenant.modulos.map((modulo, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                  >
                    {modulo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Último Acceso */}
          <div className="pt-4 border-t">
            <Label className="text-xs text-muted-foreground">Último Acceso</Label>
            <p className="text-sm font-medium">{tenant.ultimoAcceso}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

