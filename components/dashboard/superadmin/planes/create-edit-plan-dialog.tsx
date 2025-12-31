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
} from "@/components/ui/field";
import { IconX } from "@tabler/icons-react";
import type { PlanPricing, PlanType, CreatePlanPricingRequest, UpdatePlanPricingRequest } from "@/types/types";
import toast from "react-hot-toast";

interface CreateEditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanPricing | null;
  onSave: (data: CreatePlanPricingRequest | UpdatePlanPricingRequest, isEdit: boolean) => Promise<void>;
}

export function CreateEditPlanDialog({
  open,
  onOpenChange,
  plan,
  onSave,
}: CreateEditPlanDialogProps) {
  const isEdit = !!plan;
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    if (open) {
      if (plan) {
        setFeatures(plan.features || []);
      } else {
        setFeatures([]);
      }
      setNewFeature("");
    }
  }, [open, plan]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreatePlanPricingRequest | UpdatePlanPricingRequest = {
      monthlyPrice: Number(formData.get("monthlyPrice")),
      yearlyPrice: formData.get("yearlyPrice")
        ? Number(formData.get("yearlyPrice"))
        : undefined,
      description: formData.get("description")?.toString() || undefined,
      features: features.length > 0 ? features : undefined,
      isActive: formData.get("isActive") === "true",
    };

    if (!isEdit) {
      (data as CreatePlanPricingRequest).plan = formData.get("plan") as PlanType;
    }

    try {
      await onSave(data, isEdit);
      toast.success(
        isEdit
          ? "Precio de plan actualizado correctamente"
          : "Precio de plan creado exitosamente",
        {
          duration: 2000,
        }
      );
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al guardar el precio del plan";
      toast.error(errorMessage, {
        duration: 3000,
      });
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Precio de Plan" : "Crear Precio de Plan"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica la información del precio del plan"
              : "Configura un nuevo precio para un plan de suscripción"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {!isEdit && (
              <Field>
                <FieldLabel htmlFor="plan">Tipo de Plan</FieldLabel>
                <select
                  id="plan"
                  name="plan"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                >
                  <option value="">Selecciona un plan</option>
                  <option value="BASICO">BÁSICO</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
                <FieldDescription>
                  Solo puede haber un precio por tipo de plan
                </FieldDescription>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="monthlyPrice">
                  Precio Mensual (COP)
                </FieldLabel>
                <Input
                  id="monthlyPrice"
                  name="monthlyPrice"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={plan?.monthlyPrice || ""}
                  required
                />
                <FieldDescription>
                  Precio mensual en pesos colombianos
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="yearlyPrice">
                  Precio Anual (COP)
                </FieldLabel>
                <Input
                  id="yearlyPrice"
                  name="yearlyPrice"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={plan?.yearlyPrice || ""}
                />
                <FieldDescription>
                  Precio anual (opcional, puede tener descuento)
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Input
                id="description"
                name="description"
                defaultValue={plan?.description || ""}
                placeholder="Descripción del plan"
              />
              <FieldDescription>
                Descripción breve del plan y sus beneficios
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Características</FieldLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Agregar característica..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddFeature}
                  >
                    Agregar
                  </Button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="hover:text-destructive"
                        >
                          <IconX className="size-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <FieldDescription>
                Lista de características incluidas en el plan
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Estado</FieldLabel>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    defaultChecked={plan?.isActive !== false}
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
                    defaultChecked={plan?.isActive === false}
                    className="size-4"
                    required
                  />
                  <span className="text-sm">Inactivo</span>
                </label>
              </div>
              <FieldDescription>
                Solo los planes activos se usan para cálculos de MRR
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

