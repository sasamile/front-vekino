"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import type { Ticket, TicketComentario, CreateTicketComentarioRequest } from "@/types/types";
import { IconSend, IconLock } from "@tabler/icons-react";

const comentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario es requerido"),
  esInterno: z.boolean().optional(),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

interface ViewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  isAdmin?: boolean;
}

const ESTADO_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En Progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const ESTADO_COLORS: Record<string, string> = {
  ABIERTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  EN_PROGRESO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  RESUELTO: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  CERRADO: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
};

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
  MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export function ViewTicketDialog({
  open,
  onOpenChange,
  ticket,
  isAdmin = false,
}: ViewTicketDialogProps) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Obtener comentarios del ticket
  const { data: comentarios = [], refetch: refetchComentarios } = useQuery<TicketComentario[]>({
    queryKey: ["ticket-comentarios", ticket?.id],
    queryFn: async () => {
      if (!ticket?.id) return [];
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(`/comunicacion/tickets/${ticket.id}/comentarios`);
      return response.data;
    },
    enabled: open && !!ticket?.id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ComentarioFormData>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: {
      contenido: "",
      esInterno: false,
    },
  });

  const esInterno = watch("esInterno");

  // Mutación para crear comentario
  const crearComentarioMutation = useMutation({
    mutationFn: async (data: CreateTicketComentarioRequest) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/tickets/${ticket?.id}/comentarios`, data);
    },
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente", {
        duration: 2000,
      });
      reset();
      refetchComentarios();
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al agregar el comentario";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  const onSubmitComentario = async (data: ComentarioFormData) => {
    setLoading(true);
    try {
      await crearComentarioMutation.mutateAsync({
        contenido: data.contenido,
        esInterno: isAdmin ? data.esInterno : false,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  if (!ticket) return null;

  // Filtrar comentarios según si es admin o no
  const comentariosVisibles = isAdmin
    ? comentarios
    : comentarios.filter((c) => !c.esInterno);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.titulo}</DialogTitle>
          <DialogDescription>
            Detalles del ticket y comentarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del ticket */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Descripción</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Estado</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    ESTADO_COLORS[ticket.estado] || ESTADO_COLORS.ABIERTO
                  }`}
                >
                  {ESTADO_LABELS[ticket.estado] || ticket.estado}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Prioridad</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    PRIORIDAD_COLORS[ticket.prioridad] || PRIORIDAD_COLORS.MEDIA
                  }`}
                >
                  {PRIORIDAD_LABELS[ticket.prioridad] || ticket.prioridad}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Categoría</h3>
                <p className="text-sm text-muted-foreground">
                  {ticket.categoria || "Sin categoría"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Unidad</h3>
                <p className="text-sm text-muted-foreground">
                  {ticket.unidad?.identificador || "N/A"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Creado por</h3>
                <p className="text-sm text-muted-foreground">
                  {ticket.user?.name || "N/A"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Fecha de creación</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comentarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Comentarios ({comentariosVisibles.length})
            </h3>

            {/* Lista de comentarios */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {comentariosVisibles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios aún
                </p>
              ) : (
                comentariosVisibles.map((comentario) => (
                  <div
                    key={comentario.id}
                    className={`p-4 rounded-lg border ${
                      comentario.esInterno
                        ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comentario.user?.name || "Usuario"}
                        </span>
                        {comentario.esInterno && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                            <IconLock className="size-3" />
                            Interno
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comentario.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {comentario.contenido}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para agregar comentario */}
            <form onSubmit={handleSubmit(onSubmitComentario)} className="space-y-3">
              <FieldGroup>
                <Field>
                  <FieldLabel>Agregar comentario</FieldLabel>
                  <textarea
                    {...register("contenido")}
                    placeholder="Escribe tu comentario..."
                    disabled={loading}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.contenido && (
                    <FieldError>{errors.contenido.message}</FieldError>
                  )}
                </Field>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="esInterno"
                      {...register("esInterno")}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="esInterno"
                      className="text-sm text-muted-foreground flex items-center gap-1"
                    >
                      <IconLock className="size-3" />
                      Comentario interno (solo visible para administradores)
                    </label>
                  </div>
                )}
              </FieldGroup>

              <Button type="submit" disabled={loading} className="gap-2">
                <IconSend className="size-4" />
                {loading ? "Enviando..." : "Enviar comentario"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

