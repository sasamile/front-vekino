"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  IconVideo,
  IconFile,
  IconMusic,
  IconDownload,
} from "@tabler/icons-react";
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
  currentUser?: { id: string; role?: string } | null;
  onUserClick?: (userId: string, userName: string, userImage: string | null) => void;
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
  currentUser,
  onUserClick,
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
    
    return formatRelativeDate(date);
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Si la fecha es en el futuro (por diferencias de zona horaria), mostrar la fecha directamente
    if (diffMs < 0) {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) {
      // Mostrar hora cuando es del mismo día
      return `Hace ${diffHours} h · ${date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} d · ${date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })} ${date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="min-h-full">
      {error && (
        <div className="p-4 border-b border-border">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Error al cargar los posts. Por favor, intenta nuevamente.
          </div>
        </div>
      )}

      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-border p-4">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <div className="flex gap-8 pt-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center">
          <IconMessage className="size-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-lg font-semibold">No hay posts aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sé el primero en compartir algo con la comunidad
          </p>
        </div>
      ) : (
        <>
          <div>
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
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onUserClick={onUserClick}
                />
              );
            })}
          </div>

          {/* Controles de paginación */}
          {(totalPages > 1 || (total > 0 && onLimitChange)) && (
            <div className="border-t border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {total > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * limit + 1} -{" "}
                    {Math.min(currentPage * limit, total)} de {total} posts
                    {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
                  </div>
                )}
                {onLimitChange && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Por página:</span>
                    <select
                      value={limit}
                      onChange={(e) => onLimitChange(Number(e.target.value))}
                      className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          disabled={isLoading}
                          className="min-w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
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
  isAdmin: boolean;
  currentUser?: { id: string; role?: string } | null;
  onUserClick?: (userId: string, userName: string, userImage: string | null) => void;
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
  isAdmin,
  currentUser,
  onUserClick,
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
      toast.success("Comentario agregado", { duration: 2000 });
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
      toast.error(errorMessage, { duration: 3000 });
    },
  });

  // Mutación para eliminar comentario
  const eliminarComentarioMutation = useMutation({
    mutationFn: async (comentarioId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/posts/${post.id}/comentarios/${comentarioId}`);
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

  // Obtener reacciones del post (nuevo formato)
  const userReaction = post.userReaction ?? (post.userLiked ? ("LIKE" as ReactionType) : null);
  
  // Convertir reactionsCount al formato antiguo para compatibilidad
  const reactionsCount = post.reactionsCount || [];
  const reactions = post.reactions || {
    LIKE: reactionsCount.find((r) => r.tipo === "LIKE")?.count || 0,
    LOVE: reactionsCount.find((r) => r.tipo === "LOVE")?.count || 0,
    LAUGH: reactionsCount.find((r) => r.tipo === "LAUGH")?.count || 0,
    WOW: reactionsCount.find((r) => r.tipo === "WOW")?.count || 0,
    SAD: reactionsCount.find((r) => r.tipo === "SAD")?.count || 0,
    ANGRY: reactionsCount.find((r) => r.tipo === "ANGRY")?.count || 0,
    total: reactionsCount.reduce((sum, r) => sum + r.count, 0) || post.likesCount || 0,
    userReaction: userReaction,
  };

  const totalReactions = reactions.total;

  // Obtener attachments
  const attachments: PostAttachment[] = post.attachments || [];
  const hasLegacyImage = post.imagen && attachments.length === 0;

  // Función para renderizar attachment
  const renderAttachment = (attachment: PostAttachment) => {
    switch (attachment.tipo) {
      case "IMAGEN":
        return (
          <div
            key={attachment.id}
            className="mt-3 rounded-2xl overflow-hidden border border-border cursor-pointer"
            onClick={() => window.open(attachment.url, "_blank")}
          >
            <img
              src={attachment.url}
              alt={attachment.nombre}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        );
      case "VIDEO":
        return (
          <div key={attachment.id} className="mt-3 rounded-2xl overflow-hidden border border-border">
            <video
              src={attachment.url}
              controls
              className="w-full h-auto max-h-[500px]"
              poster={attachment.thumbnailUrl || undefined}
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        );
      case "AUDIO":
        return (
          <div key={attachment.id} className="mt-3 rounded-xl border border-border p-4 flex items-center gap-3">
            <IconMusic className="size-8 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.nombre}</p>
              <audio src={attachment.url} controls className="w-full mt-2" />
            </div>
            <a
              href={attachment.url}
              download
              className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
            >
              <IconDownload className="size-4" />
            </a>
          </div>
        );
      case "DOCUMENTO":
        return (
          <div
            key={attachment.id}
            className="mt-3 rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => window.open(attachment.url, "_blank")}
          >
            <IconFile className="size-8 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.tamaño / 1024).toFixed(1)} KB
              </p>
            </div>
            <IconDownload className="size-4 text-muted-foreground shrink-0" />
          </div>
        );
      default:
        return null;
    }
  };

  // Selector de reacciones estilo Facebook
  const ReactionSelector = () => {
    const [showReactions, setShowReactions] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const reactionsConfig: Array<{
      type: ReactionType;
      label: string;
      emoji: string;
      color: string;
    }> = [
      { type: "LIKE", label: "Me gusta", emoji: "👍", color: "text-blue-500" },
      { type: "LOVE", label: "Me encanta", emoji: "❤️", color: "text-red-500" },
      { type: "LAUGH", label: "Me divierte", emoji: "😂", color: "text-yellow-500" },
      { type: "WOW", label: "Me asombra", emoji: "😮", color: "text-yellow-500" },
      { type: "SAD", label: "Me entristece", emoji: "😢", color: "text-blue-500" },
      { type: "ANGRY", label: "Me enoja", emoji: "😠", color: "text-red-500" },
    ];

    const handleReaction = (reactionType: ReactionType) => {
      if (onReaction) {
        const newReaction = userReaction === reactionType ? null : reactionType;
        onReaction(newReaction);
      } else {
        onLike();
      }
      setShowReactions(false);
    };

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowReactions(true);
    };

    const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
        setShowReactions(false);
      }, 300);
    };

    const currentReaction = reactionsConfig.find((r) => r.type === userReaction);

    return (
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!userReaction && onReaction) {
              onReaction("LIKE");
            } else if (userReaction && onReaction) {
              onReaction(null);
            } else {
              onLike();
            }
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-full hover:bg-blue-500/10 transition-colors ${
            userReaction ? currentReaction?.color : "text-muted-foreground"
          }`}
        >
          {userReaction ? (
            <>
              <span className="text-lg">{currentReaction?.emoji}</span>
              <span className={`text-[13px] ${currentReaction?.color || "text-muted-foreground"}`}>
                {totalReactions > 0 ? totalReactions : ""}
              </span>
            </>
          ) : (
            <>
              <IconHeart className="size-5 group-hover:text-blue-500 transition-colors" />
              <span className="text-[13px] group-hover:text-blue-500 transition-colors">
                {totalReactions > 0 ? totalReactions : ""}
              </span>
            </>
          )}
        </button>

        {/* Popover de reacciones estilo Facebook */}
        {showReactions && (
          <div className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-full shadow-lg p-1 flex items-center gap-1 z-50">
            {reactionsConfig.map((reaction) => (
              <button
                key={reaction.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(reaction.type);
                }}
                onMouseEnter={() => {
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                }}
                className="p-2 rounded-full hover:scale-125 transition-transform text-2xl hover:bg-muted"
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <article className="border-b border-border hover:bg-muted/30 transition-colors px-4 py-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div 
          className="shrink-0 cursor-pointer"
          onClick={(e) => {
            if (onUserClick && post.user) {
              e.stopPropagation();
              onUserClick(post.user.id, post.user.name, post.user.image);
            }
          }}
        >
          <Avatar className="h-12 w-12">
            {post.user?.image && (
              <AvatarImage src={post.user.image} alt={post.user.name || "Usuario"} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(post.user?.name || "U")}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="font-semibold text-[15px] hover:underline cursor-pointer truncate max-w-[200px]"
              onClick={(e) => {
                if (onUserClick && post.user) {
                  e.stopPropagation();
                  onUserClick(post.user.id, post.user.name, post.user.image);
                }
              }}
            >
              {post.user?.name || "Usuario"}
            </span>
            {post.unidad && (
              <>
                <span className="text-muted-foreground text-[15px] shrink-0">·</span>
                <span className="text-muted-foreground text-[15px] truncate max-w-[100px]">
                  {post.unidad.identificador}
                </span>
              </>
            )}
            <span className="text-muted-foreground text-[15px] shrink-0">·</span>
            <span className="text-muted-foreground text-[15px] hover:underline cursor-pointer shrink-0">
              {formatDate(post.createdAt)}
            </span>
            {(canEdit || canDelete) && (
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDots className="size-4 text-muted-foreground" />
                    </button>
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
              </div>
            )}
          </div>

          {/* Contenido del post */}
          <div className="mb-2">
            {post.titulo && (
              <h3 className="font-semibold text-[15px] mb-1">{post.titulo}</h3>
            )}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
              {post.contenido}
            </p>
          </div>

          {/* Attachments */}
          {(attachments.length > 0 || hasLegacyImage) && (
            <>
              {attachments.map((attachment) => renderAttachment(attachment))}
              {hasLegacyImage && (
                <div
                  className="mt-3 rounded-2xl overflow-hidden border border-border cursor-pointer"
                  onClick={() => window.open(post.imagen || "", "_blank")}
                >
                  <img
                    src={post.imagen || ""}
                    alt={post.titulo || "Imagen del post"}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                </div>
              )}
            </>
          )}

          {/* Estadísticas */}
          {(totalReactions > 0 || (post.comentariosCount || 0) > 0) && (
            <div className="flex items-center gap-4 mt-3 mb-1 text-[13px] text-muted-foreground">
              {totalReactions > 0 && (
                <div className="flex items-center gap-1">
                  {/* Usar reactionsCount si está disponible, sino usar el formato antiguo */}
                  {post.reactionsCount && post.reactionsCount.length > 0 ? (
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
                        if (reaction.count > 0) {
                          return (
                            <span key={reaction.tipo} className="text-xs">
                              {emojis[reaction.tipo]}
                            </span>
                          );
                        }
                        return null;
                      })}
                      <span>{totalReactions}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center -space-x-1">
                        {reactions.LIKE > 0 && <span className="text-xs">👍</span>}
                        {reactions.LOVE > 0 && <span className="text-xs">❤️</span>}
                        {reactions.LAUGH > 0 && <span className="text-xs">😂</span>}
                        {reactions.WOW > 0 && <span className="text-xs">😮</span>}
                        {reactions.SAD > 0 && <span className="text-xs">😢</span>}
                        {reactions.ANGRY > 0 && <span className="text-xs">😠</span>}
                      </div>
                      <span>{totalReactions}</span>
                    </div>
                  )}
                </div>
              )}
              {(post.comentariosCount || 0) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComments();
                  }}
                  className="hover:underline"
                >
                  {post.comentariosCount || 0} comentario{(post.comentariosCount || 0) !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-between max-w-md mt-2">
            <ReactionSelector />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComments();
                if (!isExpanded) {
                  onStartCommenting();
                }
              }}
              className="group flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-full hover:bg-blue-500/10 transition-colors"
            >
              <IconMessage className="size-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              <span className="text-[13px] text-muted-foreground group-hover:text-blue-500 transition-colors">
                {(post.comentariosCount || 0) > 0 ? post.comentariosCount : ""}
              </span>
            </button>
          </div>

          {/* Comentarios */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border">
              {comentarios.length > 0 && (
                <div className="space-y-4 mb-4">
                  {comentarios.map((comentario) => {
                    const canDeleteComentario =
                      isAdmin || comentario.userId === currentUser?.id;
                    return (
                      <div key={comentario.id} className="flex gap-3 group">
                        <Avatar className="h-8 w-8 shrink-0">
                          {comentario.user?.image && (
                            <AvatarImage src={comentario.user.image} alt={comentario.user.name || "Usuario"} />
                          )}
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(comentario.user?.name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold">
                              {comentario.user?.name || "Usuario"}
                            </span>
                            {comentario.unidad && (
                              <>
                                <span className="text-muted-foreground text-[13px]">·</span>
                                <span className="text-muted-foreground text-[13px]">
                                  {comentario.unidad.identificador}
                                </span>
                              </>
                            )}
                            <span className="text-muted-foreground text-[13px]">·</span>
                            <span className="text-muted-foreground text-[13px]">
                              {formatDate(comentario.createdAt)}
                            </span>
                            {canDeleteComentario && (
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-1 rounded-full hover:bg-destructive/10 transition-colors"
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
                          <p className="text-[15px] whitespace-pre-wrap wrap-break-word">
                            {comentario.contenido}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Formulario de comentario */}
              <form onSubmit={handleSubmit(onSubmitComentario)} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-muted text-xs">T</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    {...register("contenido")}
                    placeholder="Escribe un comentario..."
                    disabled={loading}
                    className="flex-1 rounded-full border-border bg-background"
                    onFocus={onStartCommenting}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="rounded-full"
                  >
                    <IconSend className="size-4" />
                  </Button>
                </div>
              </form>
              {errors.contenido && (
                <p className="text-xs text-destructive ml-11 mt-1">
                  {errors.contenido.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
