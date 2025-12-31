"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { useQueryClient } from "@tanstack/react-query";
import type { Tenant } from "@/types/types";
import toast from "react-hot-toast";

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: (Tenant & { planExpiresAtISO?: string }) | null;
}

export function EditTenantDialog({
  open,
  onOpenChange,
  tenant,
}: EditTenantDialogProps) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenant) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const axiosInstance = getAxiosInstance(subdomain);

      // Convertir el estado a boolean
      const status = formData.get("estado") === "activo";

      // Convertir la fecha del formulario a ISO string
      const fechaVencimiento = formData.get("vencimiento") as string;
      const planExpiresAt = fechaVencimiento
        ? new Date(fechaVencimiento + "T00:00:00").toISOString()
        : tenant.planExpiresAtISO || new Date().toISOString();

      const updateData = {
        name: formData.get("nombre"),
        status: status ? "activo" : "suspendido",
        plan: formData.get("plan"),
        usage: {
          used: Number(formData.get("unidadesUsadas")),
          limit: Number(formData.get("unidadesLimite")),
        },
        city: formData.get("ciudad"),
        country: formData.get("pais"),
        planExpiresAt: planExpiresAt,
      };

      await axiosInstance.put(`/condominios/${tenant.id}`, updateData);

      // Invalidar queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ["metrics", "tenants"] });
      await queryClient.invalidateQueries({ queryKey: ["condominios"] });

      toast.success("Tenant actualizado correctamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al actualizar el tenant");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tenant</DialogTitle>
          <DialogDescription>
            Modifica la información del condominio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={tenant.nombre}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="plan">Plan</FieldLabel>
                <Input
                  id="plan"
                  name="plan"
                  defaultValue={tenant.plan}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="unidadesUsadas">Unidades Usadas</FieldLabel>
                <Input
                  id="unidadesUsadas"
                  name="unidadesUsadas"
                  type="number"
                  defaultValue={tenant.unidades.usadas}
                  required
                  min={0}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="unidadesLimite">Límite de Unidades</FieldLabel>
                <Input
                  id="unidadesLimite"
                  name="unidadesLimite"
                  type="number"
                  defaultValue={tenant.unidades.limite}
                  required
                  min={1}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
                <Input
                  id="ciudad"
                  name="ciudad"
                  defaultValue={tenant.ciudad}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pais">País</FieldLabel>
                <Input
                  id="pais"
                  name="pais"
                  defaultValue={tenant.pais}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vencimiento">Vencimiento del Plan</FieldLabel>
                <Input
                  id="vencimiento"
                  name="vencimiento"
                  type="date"
                  defaultValue={
                    tenant.planExpiresAtISO
                      ? new Date(tenant.planExpiresAtISO).toISOString().split("T")[0]
                      : new Date(tenant.vencimiento).toISOString().split("T")[0]
                  }
                  required
                />
              </Field>
            </div>

            <FieldSet>
              <FieldLabel>Estado</FieldLabel>
              <FieldGroup className="flex flex-col gap-2">
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="estado-activo"
                    name="estado"
                    value="activo"
                    defaultChecked={tenant.estado === "activo"}
                    className="size-4"
                    required
                  />
                  <FieldLabel htmlFor="estado-activo" className="font-normal">
                    Activo
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="estado-suspendido"
                    name="estado"
                    value="suspendido"
                    defaultChecked={tenant.estado === "suspendido"}
                    className="size-4"
                    required
                  />
                  <FieldLabel htmlFor="estado-suspendido" className="font-normal">
                    Suspendido
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

