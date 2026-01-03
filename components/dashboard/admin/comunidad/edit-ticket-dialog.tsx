"use client";

import { useState, useEffect } from "react";
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
import type { UpdateTicketRequest, Unidad, TicketEstado, TicketPrioridad } from "@/types/types";

const ticketSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  categoria: z.string().optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  unidadId: z.string().optional(),
  estado: z.enum(["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"]).optional(),
  asignadoA: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface EditTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: { id: string; titulo: string; descripcion: string; categoria: string | null; prioridad: TicketPrioridad; unidadId: string | null; estado: TicketEstado; asignadoA: string | null } | null;
  isAdmin?: boolean;
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

const ESTADO_OPTIONS: { value: TicketEstado; label: string }[] = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CERRADO", label: "Cerrado" },
];

export function EditTicketDialog({
  open,
  onOpenChange,
  ticket,
  isAdmin = false,
}: EditTicketDialogProps) {
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

  // Obtener usuarios ADMIN para asignación (solo si es admin)
  const { data: usuariosAdmin = [] } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/residentes?role=ADMIN");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: open && isAdmin,
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
      estado: "ABIERTO",
      asignadoA: "",
    },
  });

  // Actualizar formulario cuando cambia el ticket
  useEffect(() => {
    if (ticket) {
      reset({
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        categoria: ticket.categoria || "",
        prioridad: ticket.prioridad,
        unidadId: ticket.unidadId || "",
        estado: ticket.estado,
        asignadoA: ticket.asignadoA || "",
      });
    }
  }, [ticket, reset]);

  const onSubmit = async (data: TicketFormData) => {
    if (!ticket) return;

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      const requestData: UpdateTicketRequest = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria || undefined,
        prioridad: data.prioridad || undefined,
        unidadId: data.unidadId || undefined,
        estado: isAdmin ? data.estado : undefined,
        asignadoA: isAdmin ? (data.asignadoA || undefined) : undefined,
      };

      await axiosInstance.put(`/comunicacion/tickets/${ticket.id}`, requestData);

      toast.success("Ticket actualizado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["tickets"] });

      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al actualizar el ticket";

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

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ticket</DialogTitle>
          <DialogDescription>
            Actualiza la información del ticket
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

            {isAdmin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Estado</FieldLabel>
                    <select
                      {...register("estado")}
                      disabled={loading}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ESTADO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.estado && (
                      <FieldError>{errors.estado.message}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>Asignar a (Opcional)</FieldLabel>
                    <select
                      {...register("asignadoA")}
                      disabled={loading || usuariosAdmin.length === 0}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {usuariosAdmin.length === 0 ? "No hay administradores disponibles" : "Sin asignar"}
                      </option>
                      {usuariosAdmin.map((usuario: any) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.name} - {usuario.email}
                        </option>
                      ))}
                    </select>
                    {errors.asignadoA && (
                      <FieldError>{errors.asignadoA.message}</FieldError>
                    )}
                  </Field>
                </div>
              </>
            )}
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
              {loading ? "Actualizando..." : "Actualizar Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

