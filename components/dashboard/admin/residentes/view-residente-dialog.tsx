"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Residente, Unidad } from "@/types/types";
import {
  IconUser,
  IconBuilding,
  IconMail,
  IconPhone,
  IconId,
  IconShield,
  IconKey,
  IconCopy,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface ViewResidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residente: Residente | null;
  unidades: Unidad[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PROPIETARIO: "Propietario",
  ARRENDATARIO: "Arrendatario",
  RESIDENTE: "Residente",
};

const DOCUMENTO_LABELS: Record<string, string> = {
  CC: "Cédula de Ciudadanía",
  CE: "Cédula de Extranjería",
  NIT: "NIT",
  PASAPORTE: "Pasaporte",
  OTRO: "Otro",
};

export function ViewResidenteDialog({
  open,
  onOpenChange,
  residente,
  unidades,
}: ViewResidenteDialogProps) {
  if (!residente) return null;

  const unidad = unidades.find((u) => u.id === residente.unidadId);
  console.log(residente);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información del Residente</DialogTitle>
          <DialogDescription>
            Detalles completos del residente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconUser className="size-5" />
              Información Personal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nombre Completo
                </label>
                <p className="text-sm font-medium mt-1">{residente.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Primer Nombre
                </label>
                <p className="text-sm font-medium mt-1">
                  {residente.firstName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Apellido
                </label>
                <p className="text-sm font-medium mt-1">{residente.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Rol
                </label>
                <p className="text-sm font-medium mt-1">
                  {ROLE_LABELS[residente.role] || residente.role}
                </p>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconMail className="size-5" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IconMail className="size-4" />
                  Email
                </label>
                <p className="text-sm font-medium mt-1">{residente.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IconPhone className="size-4" />
                  Teléfono
                </label>
                <p className="text-sm font-medium mt-1">{residente.telefono}</p>
              </div>
            </div>
          </div>

          {/* Información de Documento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconId className="size-5" />
              Documento de Identidad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Documento
                </label>
                <p className="text-sm font-medium mt-1">
                  {DOCUMENTO_LABELS[residente.tipoDocumento] ||
                    residente.tipoDocumento}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Número de Documento
                </label>
                <p className="text-sm font-medium mt-1">
                  {residente.numeroDocumento}
                </p>
              </div>
            </div>
          </div>

          {/* Información de Unidad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconBuilding className="size-5" />
              Unidad Asignada
            </h3>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Unidad
              </label>
              <p className="text-sm font-medium mt-1">
                {unidad
                  ? `${unidad.identificador} - ${unidad.tipo}`
                  : "No asignada"}
              </p>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconShield className="size-5" />
              Información del Sistema
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {residente.temporaryPassword && (
                <div className="col-span-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                  <label className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <IconKey className="size-4" />
                    Contraseña Temporal
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-mono font-bold text-amber-900 dark:text-amber-300">
                      {residente.temporaryPassword}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-2 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          residente.temporaryPassword!,
                        );
                        toast.success("Contraseña copiada al portapapeles");
                      }}
                    >
                      <IconCopy className="size-4" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha de Creación
                </label>
                <p className="text-sm font-medium mt-1">
                  {new Date(residente.createdAt).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Última Actualización
                </label>
                <p className="text-sm font-medium mt-1">
                  {new Date(residente.updatedAt).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
