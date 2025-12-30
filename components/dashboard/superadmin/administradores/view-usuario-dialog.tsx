"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { IconCheck, IconX, IconUser } from "@tabler/icons-react";
import type { Usuario } from "@/types/users";

interface ViewUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
}

// Función para traducir roles
const translateRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: "Administrador",
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE: "Residente",
  };
  return roleMap[role] || role;
};

// Función para traducir tipo de documento
const translateTipoDocumento = (tipo: string | null): string => {
  if (!tipo) return "No disponible";
  const tipoMap: Record<string, string> = {
    CC: "Cédula de Ciudadanía",
    CE: "Cédula de Extranjería",
    PASAPORTE: "Pasaporte",
    TI: "Tarjeta de Identidad",
  };
  return tipoMap[tipo] || tipo;
};

export function ViewUsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: ViewUsuarioDialogProps) {
  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
          <DialogDescription>
            Información completa del usuario seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Información del Usuario */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <IconUser className="size-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{usuario.name}</h3>
              <p className="text-muted-foreground">{usuario.email}</p>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <p className="text-sm font-medium">{usuario.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    usuario.active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {usuario.active ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconX className="size-3.5" />
                  )}
                  {usuario.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rol</Label>
              <div className="mt-1">
                {usuario.role === "ADMIN" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    {translateRole(usuario.role)}
                  </span>
                ) : (
                  <p className="text-sm font-medium">{translateRole(usuario.role)}</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{usuario.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Email Verificado
              </Label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    usuario.emailVerified
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                  }`}
                >
                  {usuario.emailVerified ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconX className="size-3.5" />
                  )}
                  {usuario.emailVerified ? "Verificado" : "No Verificado"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <p className="text-sm font-medium">
                {usuario.telefono || "No disponible"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Tipo de Documento
              </Label>
              <p className="text-sm font-medium">
                {translateTipoDocumento(usuario.tipoDocumento)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Número de Documento
              </Label>
              <p className="text-sm font-medium">
                {usuario.numeroDocumento || usuario.identificationNumber || "No disponible"}
              </p>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">
                Fecha de Creación
              </Label>
              <p className="text-sm font-medium">
                {new Date(usuario.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Última Actualización
              </Label>
              <p className="text-sm font-medium">
                {new Date(usuario.updatedAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

