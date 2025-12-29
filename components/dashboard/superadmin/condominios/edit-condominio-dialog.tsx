"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Condominio } from "@/types/types";

interface EditCondominioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominio: Condominio | null;
  onSave: (data: Partial<Condominio>) => void;
}

export function EditCondominioDialog({
  open,
  onOpenChange,
  condominio,
  onSave,
}: EditCondominioDialogProps) {
  if (!condominio) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Condominio> = {
      name: formData.get("name") as string,
      nit: formData.get("nit") as string,
      subdomain: formData.get("subdomain") as string,
      subscriptionPlan: formData.get("subscriptionPlan") as string,
      unitLimit: Number(formData.get("unitLimit")),
      primaryColor: formData.get("primaryColor") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
      timezone: formData.get("timezone") as string,
      planExpiresAt: formData.get("planExpiresAt") as string,
      logo: formData.get("logo") as string,
      isActive: formData.get("isActive") === "true",
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Condominio</DialogTitle>
          <DialogDescription>
            Modifica la información del condominio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={condominio.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  name="nit"
                  defaultValue={condominio.nit}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdominio</Label>
                <Input
                  id="subdomain"
                  name="subdomain"
                  defaultValue={condominio.subdomain}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Plan de Suscripción</Label>
                <Input
                  id="subscriptionPlan"
                  name="subscriptionPlan"
                  defaultValue={condominio.subscriptionPlan}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitLimit">Límite de Unidades</Label>
                <Input
                  id="unitLimit"
                  name="unitLimit"
                  type="number"
                  defaultValue={condominio.unitLimit}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Color Primario</Label>
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  defaultValue={condominio.primaryColor}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={condominio.address}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={condominio.city}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={condominio.country}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={condominio.timezone}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planExpiresAt">Vencimiento del Plan</Label>
                <Input
                  id="planExpiresAt"
                  name="planExpiresAt"
                  type="date"
                  defaultValue={new Date(condominio.planExpiresAt).toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">URL del Logo</Label>
                <Input
                  id="logo"
                  name="logo"
                  defaultValue={condominio.logo || ""}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Estado</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    defaultChecked={condominio.isActive}
                    className="size-4"
                    required
                  />
                  <span className="text-sm">Activo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    defaultChecked={!condominio.isActive}
                    className="size-4"
                    required
                  />
                  <span className="text-sm">Inactivo</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

