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
import { IconSend, IconHeart, IconHeartFilled, IconTrash, IconDots, IconUser } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const comentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario es requerido"),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onLike?: (post: Post) => void;
  isAdmin?: boolean;
  currentUser?: { id: string; role?: string } | null;
}

export function ViewPostDialog({
  open,
  onOpenChange,
  post,
  onLike,
  isAdmin = false,
  currentUser,
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

  // Mutación para eliminar comentario
  const eliminarComentarioMutation = useMutation({
    mutationFn: async (comentarioId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/posts/${post?.id}/comentarios/${comentarioId}`);
    },
    onSuccess: () => {
      toast.success("Comentario eliminado exitosamente", {
        duration: 2000,
      });
      refetchComentarios();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el comentario";
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
    
    let date: Date;
    
    // Manejar formato SQL datetime: "2026-01-03 11:06:05.214"
    if (dateString.includes(" ") && !dateString.includes("T")) {
      // Parsear manualmente para evitar problemas de zona horaria
      const parts = dateString.split(" ");
      const datePart = parts[0]; // "2026-01-03"
      const timePart = parts[1]?.split(".")[0] || "00:00:00"; // "11:06:05"
      
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);
      
      // Crear fecha en hora local (no UTC)
      date = new Date(year, month - 1, day, hour, minute, second || 0);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString("es-ES", {
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
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                {post.user?.image && (
                  <AvatarImage src={post.user.image} alt={post.user.name || "Usuario"} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {post.user?.name
                    ? post.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
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
              {/* Mostrar reacciones usando el nuevo formato */}
              {post.reactionsCount && post.reactionsCount.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {post.reactionsCount.map((reaction) => {
                      const emojis: Record<string, string> = {
                        LIKE: "👍",
                        LOVE: "❤️",
                        LAUGH: "😂",
                        WOW: "😮",
                        SAD: "😢",
                        ANGRY: "😠",
                      };
                      return (
                        <span key={reaction.tipo} className="text-sm">
                          {emojis[reaction.tipo]} {reaction.count}
                        </span>
                      );
                    })}
                  </div>
                  {post.userReaction && (
                    <span className="text-xs text-muted-foreground">
                      · Tu reacción: {post.userReaction}
                    </span>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => onLike && onLike(post)}
                >
                  {post.userLiked || post.userReaction ? (
                    <IconHeartFilled className="size-4 text-red-500" />
                  ) : (
                    <IconHeart className="size-4" />
                  )}
                  <span>{post.likesCount || 0} likes</span>
                </Button>
              )}
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
                comentarios.map((comentario) => {
                  const canDeleteComentario =
                    isAdmin || comentario.userId === currentUser?.id;
                  return (
                    <div
                      key={comentario.id}
                      className="p-4 rounded-lg border bg-muted/50 group"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          {comentario.user?.image && (
                            <AvatarImage src={comentario.user.image} alt={comentario.user.name || "Usuario"} />
                          )}
                          <AvatarFallback className="bg-muted text-xs">
                            {comentario.user?.name
                              ? comentario.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
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
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comentario.createdAt)}
                            </span>
                            {canDeleteComentario && (
                              <div className="ml-auto">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-1 rounded-full hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconDots className="size-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (
                                          confirm(
                                            "¿Estás seguro de que quieres eliminar este comentario?"
                                          )
                                        ) {
                                          eliminarComentarioMutation.mutate(comentario.id);
                                        }
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <IconTrash className="size-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {comentario.contenido}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
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

