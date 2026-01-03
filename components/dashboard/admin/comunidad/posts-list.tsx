"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconEdit,
  IconTrash,
  IconSend,
  IconDots,
  IconPhoto,
  IconX,
  IconMoodSmile,
  IconMoodHappy,
  IconMoodCrazyHappy,
  IconMoodSad,
  IconMoodAngry,
  IconVideo,
  IconFile,
  IconMusic,
  IconDownload,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type {
  Post,
  PostComentario,
  CreatePostComentarioRequest,
  ReactionType,
  PostAttachment,
} from "@/types/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const comentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario es requerido"),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  error: Error | null;
  onView?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onLike?: (post: Post) => void;
  onReaction?: (post: Post, reactionType: ReactionType | null) => void;
  isAdmin?: boolean;
  isAuthor?: (post: Post) => boolean;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function PostsList({
  posts,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  onLike,
  onReaction,
  isAdmin = false,
  isAuthor,
  total = 0,
  currentPage = 1,
  totalPages = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: PostsListProps) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Error al cargar los posts. Por favor, intenta nuevamente.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-card rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconMessage className="size-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay posts en el foro aún</p>
          <p className="text-sm">Sé el primero en compartir algo con la comunidad</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => {
              const canEdit = isAdmin || (isAuthor ? isAuthor(post) : false);
              const canDelete = isAdmin || (isAuthor ? isAuthor(post) : false);
              const isExpanded = expandedComments[post.id] || false;
              const isCommenting = commentingPostId === post.id;

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  isExpanded={isExpanded}
                  isCommenting={isCommenting}
                  onToggleComments={() => toggleComments(post.id)}
                  onStartCommenting={() => setCommentingPostId(post.id)}
                  onStopCommenting={() => setCommentingPostId(null)}
                  onLike={() => onLike && onLike(post)}
                  onReaction={(reactionType) => onReaction && onReaction(post, reactionType)}
                  onEdit={() => onEdit && onEdit(post)}
                  onDelete={() => onDelete && onDelete(post)}
                  formatDate={formatDate}
                  getInitials={getInitials}
                />
              );
            })}
          </div>

          {/* Controles de paginación */}
          {(totalPages > 1 || (total > 0 && onLimitChange)) && (
            <div className="shrink-0 flex items-center justify-between border-t pt-4 mt-6">
              <div className="flex items-center gap-4">
                {total > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * limit + 1} -{" "}
                    {Math.min(currentPage * limit, total)} de {total} posts
                    {totalPages > 1 &&
                      ` - Página ${currentPage} de ${totalPages}`}
                  </div>
                )}
                {onLimitChange && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Por página:
                    </span>
                    <select
                      value={limit}
                      onChange={(e) => onLimitChange(Number(e.target.value))}
                      className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                )}
              </div>
              {onPageChange && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <IconChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, totalPages) },
                      (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            disabled={isLoading}
                            className="min-w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Siguiente
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  canEdit: boolean;
  canDelete: boolean;
  isExpanded: boolean;
  isCommenting: boolean;
  onToggleComments: () => void;
  onStartCommenting: () => void;
  onStopCommenting: () => void;
  onLike: () => void;
  onReaction?: (reactionType: ReactionType | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
}

function PostCard({
  post,
  canEdit,
  canDelete,
  isExpanded,
  isCommenting,
  onToggleComments,
  onStartCommenting,
  onStopCommenting,
  onLike,
  onReaction,
  onEdit,
  onDelete,
  formatDate,
  getInitials,
}: PostCardProps) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Obtener comentarios del post
  const { data: comentarios = [], refetch: refetchComentarios } = useQuery<PostComentario[]>({
    queryKey: ["post-comentarios", post.id],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(`/comunicacion/posts/${post.id}/comentarios`);
      return response.data;
    },
    enabled: isExpanded || isCommenting,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ contenido: string }>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: {
      contenido: "",
    },
  });

  // Mutación para crear comentario
  const crearComentarioMutation = useMutation({
    mutationFn: async (data: CreatePostComentarioRequest) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/posts/${post.id}/comentarios`, data);
    },
    onSuccess: () => {
      toast.success("Comentario agregado", {
        duration: 2000,
      });
      reset();
      refetchComentarios();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onStopCommenting();
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

  const onSubmitComentario = async (data: { contenido: string }) => {
    setLoading(true);
    try {
      await crearComentarioMutation.mutateAsync({
        contenido: data.contenido,
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener reacciones del post
  const reactions = post.reactions || {
    LIKE: 0,
    LOVE: 0,
    LAUGH: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
    total: post.likesCount || 0,
    userReaction: post.userLiked ? ("LIKE" as ReactionType) : null,
  };

  const userReaction = reactions.userReaction;
  const totalReactions = reactions.total;

  // Obtener attachments (usar attachments si existen, sino usar imagen legacy)
  const attachments: PostAttachment[] = post.attachments || [];
  const hasLegacyImage = post.imagen && attachments.length === 0;

  // Función para renderizar attachment
  const renderAttachment = (attachment: PostAttachment) => {
    switch (attachment.tipo) {
      case "IMAGEN":
        return (
          <div key={attachment.id} className="rounded-lg overflow-hidden bg-muted">
            <img
              src={attachment.url}
              alt={attachment.nombre}
              className="w-full h-auto max-h-[600px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(attachment.url, "_blank")}
            />
          </div>
        );
      case "VIDEO":
        return (
          <div key={attachment.id} className="rounded-lg overflow-hidden bg-muted">
            <video
              src={attachment.url}
              controls
              className="w-full h-auto max-h-[600px]"
              poster={attachment.thumbnailUrl || undefined}
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        );
      case "AUDIO":
        return (
          <div
            key={attachment.id}
            className="rounded-lg bg-muted p-4 flex items-center gap-3"
          >
            <IconMusic className="size-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{attachment.nombre}</p>
              <audio src={attachment.url} controls className="w-full mt-2" />
            </div>
            <a
              href={attachment.url}
              download
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <IconDownload className="size-4" />
            </a>
          </div>
        );
      case "DOCUMENTO":
        return (
          <div
            key={attachment.id}
            className="rounded-lg border bg-muted/50 p-4 flex items-center gap-3 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => window.open(attachment.url, "_blank")}
          >
            <IconFile className="size-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.tamaño / 1024).toFixed(1)} KB
              </p>
            </div>
            <IconDownload className="size-4 text-muted-foreground" />
          </div>
        );
      default:
        return null;
    }
  };

  // Selector de reacciones
  const ReactionSelector = () => {
    const [isOpen, setIsOpen] = useState(false);

    const reactionsConfig: Array<{
      type: ReactionType;
      label: string;
      emoji: string;
    }> = [
      { type: "LIKE", label: "Me gusta", emoji: "👍" },
      { type: "LOVE", label: "Me encanta", emoji: "❤️" },
      { type: "LAUGH", label: "Me divierte", emoji: "😂" },
      { type: "WOW", label: "Me asombra", emoji: "😮" },
      { type: "SAD", label: "Me entristece", emoji: "😢" },
      { type: "ANGRY", label: "Me enoja", emoji: "😠" },
    ];

    const handleReaction = (reactionType: ReactionType) => {
      if (onReaction) {
        // Si ya tiene esa reacción, eliminar; sino, agregar/actualizar
        const newReaction = userReaction === reactionType ? null : reactionType;
        onReaction(newReaction);
      } else {
        // Fallback al sistema antiguo
        onLike();
      }
      setIsOpen(false);
    };

    const currentReaction = reactionsConfig.find((r) => r.type === userReaction);

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-accent/50 relative"
            onMouseEnter={() => setIsOpen(true)}
          >
            {userReaction ? (
              <>
                <span className="text-lg">{currentReaction?.emoji}</span>
                <span className="font-medium">{currentReaction?.label}</span>
              </>
            ) : (
              <>
                <IconHeart className="size-5" />
                <span>Me gusta</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="start"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center gap-1">
            {reactionsConfig.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className="p-2 rounded-full hover:bg-accent transition-all hover:scale-125 text-2xl"
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      {/* Header del post */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(post.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{post.user?.name || "Usuario"}</span>
                {post.unidad && (
                  <span className="text-xs text-muted-foreground">
                    • {post.unidad.identificador}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <IconEdit className="size-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="size-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Contenido del post */}
      <div className="px-4 pb-3">
        {post.titulo && (
          <h3 className="font-semibold text-base mb-2">{post.titulo}</h3>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {post.contenido}
        </p>
      </div>

      {/* Archivos adjuntos del post */}
      {(attachments.length > 0 || hasLegacyImage) && (
        <div className="px-4 pb-3 space-y-2">
          {attachments.map((attachment) => renderAttachment(attachment))}
          {hasLegacyImage && (
            <div className="rounded-lg overflow-hidden bg-muted">
              <img
                src={post.imagen || ""}
                alt={post.titulo || "Imagen del post"}
                className="w-full h-auto max-h-[600px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.open(post.imagen || "", "_blank")}
              />
            </div>
          )}
        </div>
      )}

      {/* Estadísticas y acciones */}
      <div className="px-4 py-3 border-t">
        {/* Estadísticas de reacciones y comentarios */}
        {(totalReactions > 0 || (post.comentariosCount || 0) > 0) && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div className="flex items-center gap-4 text-sm">
              {totalReactions > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center -space-x-1">
                    {reactions.LIKE > 0 && (
                      <span className="text-xs" title="Me gusta">
                        👍
                      </span>
                    )}
                    {reactions.LOVE > 0 && (
                      <span className="text-xs" title="Me encanta">
                        ❤️
                      </span>
                    )}
                    {reactions.LAUGH > 0 && (
                      <span className="text-xs" title="Me divierte">
                        😂
                      </span>
                    )}
                    {reactions.WOW > 0 && (
                      <span className="text-xs" title="Me asombra">
                        😮
                      </span>
                    )}
                    {reactions.SAD > 0 && (
                      <span className="text-xs" title="Me entristece">
                        😢
                      </span>
                    )}
                    {reactions.ANGRY > 0 && (
                      <span className="text-xs" title="Me enoja">
                        😠
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground">{totalReactions}</span>
                </div>
              )}
              {(post.comentariosCount || 0) > 0 && (
                <button
                  onClick={onToggleComments}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {post.comentariosCount || 0} comentario
                  {(post.comentariosCount || 0) !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-1">
          <ReactionSelector />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-accent/50"
            onClick={() => {
              onToggleComments();
              if (!isExpanded) {
                onStartCommenting();
              }
            }}
          >
            <IconMessage className="size-5" />
            <span>Comentar</span>
          </Button>
        </div>

        {/* Comentarios expandidos */}
        {isExpanded && (
          <div className="mt-4 space-y-3 pt-3 border-t">
            {/* Lista de comentarios */}
            {comentarios.length > 0 && (
              <div className="space-y-3">
                {comentarios.map((comentario) => (
                  <div key={comentario.id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {getInitials(comentario.user?.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {comentario.user?.name || "Usuario"}
                          </span>
                          {comentario.unidad && (
                            <span className="text-xs text-muted-foreground">
                              {comentario.unidad.identificador}
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {comentario.contenido}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDate(comentario.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario de comentario */}
            <form onSubmit={handleSubmit(onSubmitComentario)} className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-xs">T</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  {...register("contenido")}
                  placeholder="Escribe un comentario..."
                  disabled={loading}
                  className="flex-1"
                  onFocus={onStartCommenting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="gap-2"
                >
                  <IconSend className="size-4" />
                </Button>
              </div>
            </form>
            {errors.contenido && (
              <p className="text-xs text-destructive ml-10">
                {errors.contenido.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
