"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { CreateTicketRequest, Unidad, TicketPrioridad } from "@/types/types";

const ticketSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  categoria: z.string().optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  unidadId: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIA_OPTIONS = [
  "Iluminación",
  "Poda",
  "Limpieza",
  "Plomería",
  "Electricidad",
  "Seguridad",
  "Otro",
];

const PRIORIDAD_OPTIONS: { value: TicketPrioridad; label: string }[] = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  // Obtener unidades
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      categoria: "",
      prioridad: "MEDIA",
      unidadId: "",
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      const requestData: CreateTicketRequest = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria || undefined,
        prioridad: data.prioridad || undefined,
        unidadId: data.unidadId || undefined,
      };

      await axiosInstance.post("/comunicacion/tickets", requestData);

      toast.success("Ticket creado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["tickets"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el ticket";

      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo ticket de administración
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Título *</FieldLabel>
              <Input
                {...register("titulo")}
                placeholder="Ej: Problema con iluminación"
                disabled={loading}
              />
              {errors.titulo && (
                <FieldError>{errors.titulo.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Descripción *</FieldLabel>
              <textarea
                {...register("descripcion")}
                placeholder="Describe el problema o solicitud..."
                disabled={loading}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.descripcion && (
                <FieldError>{errors.descripcion.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Categoría</FieldLabel>
                <select
                  {...register("categoria")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIA_OPTIONS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <FieldError>{errors.categoria.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Prioridad</FieldLabel>
                <select
                  {...register("prioridad")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PRIORIDAD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.prioridad && (
                  <FieldError>{errors.prioridad.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Unidad (Opcional)</FieldLabel>
              <select
                {...register("unidadId")}
                disabled={loading || unidades.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {unidades.length === 0 ? "Cargando unidades..." : "Selecciona una unidad"}
                </option>
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.identificador} - {unidad.tipo}
                  </option>
                ))}
              </select>
              {errors.unidadId && (
                <FieldError>{errors.unidadId.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

