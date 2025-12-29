"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { Condominio } from "@/types/types";
import { CondominioLogo } from "./condominio-logo";

interface ViewCondominioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominio: Condominio | null;
}

export function ViewCondominioDialog({
  open,
  onOpenChange,
  condominio,
}: ViewCondominioDialogProps) {
  if (!condominio) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Condominio</DialogTitle>
          <DialogDescription>
            Información completa del condominio seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <CondominioLogo
              logo={condominio.logo}
              name={condominio.name}
              primaryColor={condominio.primaryColor}
            />
            <div>
              <h3 className="text-2xl font-bold">{condominio.name}</h3>
              <p className="text-muted-foreground">
                {condominio.subdomain}.vekino.site
              </p>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">NIT</Label>
              <p className="text-sm font-medium">{condominio.nit}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    condominio.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {condominio.isActive ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconX className="size-3.5" />
                  )}
                  {condominio.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Plan de Suscripción</Label>
              <p className="text-sm font-medium">{condominio.subscriptionPlan}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Límite de Unidades</Label>
              <p className="text-sm font-medium">{condominio.unitLimit}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Color Primario</Label>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="size-6 rounded border"
                  style={{ backgroundColor: condominio.primaryColor }}
                />
                <p className="text-sm font-medium">{condominio.primaryColor}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Zona Horaria</Label>
              <p className="text-sm font-medium">{condominio.timezone}</p>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ubicación</Label>
            <div className="space-y-1">
              <p className="text-sm font-medium">{condominio.address}</p>
              <p className="text-sm text-muted-foreground">
                {condominio.city}, {condominio.country}
              </p>
            </div>
          </div>

          {/* Módulos Activos */}
          <div>
            <Label className="text-xs text-muted-foreground">Módulos Activos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(() => {
                try {
                  const modules = JSON.parse(condominio.activeModules);
                  return Array.isArray(modules) ? modules : [];
                } catch {
                  return [];
                }
              })().map((module: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">Vencimiento del Plan</Label>
              <p className="text-sm font-medium">
                {new Date(condominio.planExpiresAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fecha de Creación</Label>
              <p className="text-sm font-medium">
                {new Date(condominio.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Última Actualización</Label>
              <p className="text-sm font-medium">
                {new Date(condominio.updatedAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

