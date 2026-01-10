"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
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
import { IconX, IconUpload } from "@tabler/icons-react";
import type { Condominio, PlanPricing } from "@/types/types";
import { CondominioLogo } from "./condominio-logo";
import toast from "react-hot-toast";

interface EditCondominioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominio: Condominio | null;
  onSave: (formData: FormData) => void;
}

export function EditCondominioDialog({
  open,
  onOpenChange,
  condominio,
  onSave,
}: EditCondominioDialogProps) {
  const { subdomain } = useSubdomain();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener planes disponibles
  const { data: plans = [] } = useQuery<PlanPricing[]>({
    queryKey: ["plan-pricing"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/plan-pricing");
      return response.data;
    },
    enabled: open, // Solo hacer la query cuando el diálogo está abierto
  });

  // Resetear estado cuando cambia el condominio o se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (condominio) {
      setLogoPreview(condominio.logo || null);
      setRemoveLogo(false);
    }
  }, [open, condominio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setRemoveLogo(false);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  if (!condominio) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Si hay un nuevo archivo de logo, agregarlo
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    // Si se quiere remover el logo, agregar un flag especial
    // El backend debería manejar esto, pero por ahora solo no enviamos el logo
    if (removeLogo && !logoFile) {
      // Opcional: puedes agregar un campo para indicar que se debe borrar
      // formData.append("removeLogo", "true");
    }

    // Convertir los valores booleanos a strings
    const isActiveValue = formData.get("isActive");
    formData.set("isActive", isActiveValue === "true" ? "true" : "false");

    onSave(formData);

    setTimeout(() => {
      toast.success("Condominio actualizado correctamente", {
        duration: 1000,
      });
    }, 1500);

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
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="name">Nombre</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={condominio.name}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nit">NIT</FieldLabel>
                <Input
                  id="nit"
                  name="nit"
                  defaultValue={condominio.nit}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subdomain">Subdominio</FieldLabel>
                <Input
                  id="subdomain"
                  name="subdomain"
                  defaultValue={condominio.subdomain}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subscriptionPlan">
                  Plan de Suscripción
                </FieldLabel>
                <select
                  id="subscriptionPlan"
                  name="subscriptionPlan"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={condominio.subscriptionPlan}
                >
                  {plans.length > 0 ? (
                    plans.map((plan) => (
                      <option key={plan.id} value={plan.plan}>
                        {plan.plan}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={condominio.subscriptionPlan}>
                        {condominio.subscriptionPlan}
                      </option>
                      <option value="BASICO">BASICO</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </>
                  )}
                </select>
                <FieldDescription>
                  Selecciona el plan de suscripción del condominio
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="unitLimit">Límite de Unidades</FieldLabel>
                <Input
                  id="unitLimit"
                  name="unitLimit"
                  type="number"
                  defaultValue={condominio.unitLimit}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="primaryColor">Color Primario</FieldLabel>
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  defaultValue={condominio.primaryColor}
                  className="h-10"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Dirección</FieldLabel>
                <Input
                  id="address"
                  name="address"
                  defaultValue={condominio.address}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                <Input
                  id="city"
                  name="city"
                  defaultValue={condominio.city}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="country">País</FieldLabel>
                <Input
                  id="country"
                  name="country"
                  defaultValue={condominio.country}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="timezone">Zona Horaria</FieldLabel>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={condominio.timezone}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="planExpiresAt">
                  Vencimiento del Plan
                </FieldLabel>
                <Input
                  id="planExpiresAt"
                  name="planExpiresAt"
                  type="datetime-local"
                  defaultValue={new Date(condominio.planExpiresAt)
                    .toISOString()
                    .slice(0, 16)}
                  required
                />
              </Field>
            </div>

            {/* Campo de Logo con file input */}
            <Field>
              <FieldLabel>Logo</FieldLabel>
              {logoPreview && !removeLogo ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="relative">
                      <CondominioLogo
                        logo={logoPreview}
                        name={condominio.name}
                        primaryColor={condominio.primaryColor}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 rounded-full size-6"
                        onClick={handleRemoveLogo}
                      >
                        <IconX className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div
                  onClick={handleFileClick}
                  className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors"
                >
                  <IconUpload className="size-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Haz clic para subir un logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    o arrastra y suelta un archivo aquí
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </Field>

            <FieldSet>
              <FieldLabel>Estado</FieldLabel>
              <FieldGroup className="flex flex-col gap-2">
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="isActive-true"
                    name="isActive"
                    value="true"
                    defaultChecked={condominio.isActive}
                    className="size-4"
                    required
                  />
                  <FieldLabel htmlFor="isActive-true" className="font-normal">
                    Activo
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="isActive-false"
                    name="isActive"
                    value="false"
                    defaultChecked={!condominio.isActive}
                    className="size-4"
                    required
                  />
                  <FieldLabel htmlFor="isActive-false" className="font-normal">
                    Inactivo
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
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
