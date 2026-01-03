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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { Post, PostComentario, CreatePostComentarioRequest } from "@/types/types";
import { IconSend, IconHeart, IconHeartFilled } from "@tabler/icons-react";

const comentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario es requerido"),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onLike?: (post: Post) => void;
}

export function ViewPostDialog({
  open,
  onOpenChange,
  post,
  onLike,
}: ViewPostDialogProps) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Obtener comentarios del post
  const { data: comentarios = [], refetch: refetchComentarios } = useQuery<PostComentario[]>({
    queryKey: ["post-comentarios", post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(`/comunicacion/posts/${post.id}/comentarios`);
      return response.data;
    },
    enabled: open && !!post?.id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ComentarioFormData>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: {
      contenido: "",
    },
  });

  // Mutación para crear comentario
  const crearComentarioMutation = useMutation({
    mutationFn: async (data: CreatePostComentarioRequest) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/posts/${post?.id}/comentarios`, data);
    },
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente", {
        duration: 2000,
      });
      reset();
      refetchComentarios();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {post.titulo && <DialogTitle>{post.titulo}</DialogTitle>}
          <DialogDescription>
            Post y comentarios de la comunidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del post */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{post.user?.name || "Usuario"}</span>
              {post.unidad && (
                <>
                  <span>•</span>
                  <span>{post.unidad.identificador}</span>
                </>
              )}
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>

            <p className="text-sm whitespace-pre-wrap">
              {post.contenido}
            </p>

            {post.imagen && (
              <div>
                <img
                  src={post.imagen}
                  alt={post.titulo || "Imagen del post"}
                  className="rounded-lg max-w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => onLike && onLike(post)}
              >
                {post.userLiked ? (
                  <IconHeartFilled className="size-4 text-red-500" />
                ) : (
                  <IconHeart className="size-4" />
                )}
                <span>{post.likesCount || 0} likes</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Comentarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Comentarios ({comentarios.length})
            </h3>

            {/* Lista de comentarios */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {comentarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios aún
                </p>
              ) : (
                comentarios.map((comentario) => (
                  <div
                    key={comentario.id}
                    className="p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comentario.user?.name || "Usuario"}
                        </span>
                        {comentario.unidad && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {comentario.unidad.identificador}
                            </span>
                          </>
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

