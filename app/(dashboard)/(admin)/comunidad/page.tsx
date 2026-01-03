"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type {
  Ticket,
  Post,
  Unidad,
  TicketEstado,
  ReactionType,
} from "@/types/types";
import type { TicketsFilters } from "@/components/dashboard/admin/comunidad/tickets-filters";
import { TicketsTable } from "@/components/dashboard/admin/comunidad/tickets-table";
import { TicketsFiltersComponent } from "@/components/dashboard/admin/comunidad/tickets-filters";
import { CreateTicketDialog } from "@/components/dashboard/admin/comunidad/create-ticket-dialog";
import { ViewTicketDialog } from "@/components/dashboard/admin/comunidad/view-ticket-dialog";
import { EditTicketDialog } from "@/components/dashboard/admin/comunidad/edit-ticket-dialog";
import { PostsList } from "@/components/dashboard/admin/comunidad/posts-list";
import { CreatePostDialog } from "@/components/dashboard/admin/comunidad/create-post-dialog";
import { ViewPostDialog } from "@/components/dashboard/admin/comunidad/view-post-dialog";
import { EditPostDialog } from "@/components/dashboard/admin/comunidad/edit-post-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled, IconTicket, IconMessageCircle } from "@tabler/icons-react";

type TabType = "tickets" | "foro";

function ComunidadPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("tickets");
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  const [editTicketDialogOpen, setEditTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [viewPostDialogOpen, setViewPostDialogOpen] = useState(false);
  const [editPostDialogOpen, setEditPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Filtros para tickets
  const [ticketFilters, setTicketFilters] = useState<TicketsFilters>({
    page: 1,
    limit: 10,
  });

  // Filtros para posts
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 10,
    activo: true,
  });

  // Obtener unidades para filtros
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  // Obtener usuario actual para verificar permisos
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
  });

  // En rutas de admin, el usuario siempre es admin (el middleware ya lo verificó)
  // Si currentUser aún no se ha cargado, asumir que es admin para mostrar las acciones
  const isAdmin = currentUser ? currentUser.role === "ADMIN" : true;

  // Construir query params para tickets
  const ticketQueryParams = new URLSearchParams();
  if (ticketFilters.estado) ticketQueryParams.append("estado", ticketFilters.estado);
  if (ticketFilters.categoria) ticketQueryParams.append("categoria", ticketFilters.categoria);
  if (ticketFilters.unidadId) ticketQueryParams.append("unidadId", ticketFilters.unidadId);
  if (ticketFilters.userId) ticketQueryParams.append("userId", ticketFilters.userId);
  ticketQueryParams.append("page", String(ticketFilters.page));
  ticketQueryParams.append("limit", String(ticketFilters.limit));

  const ticketQueryString = ticketQueryParams.toString();
  const ticketEndpoint = `/comunicacion/tickets${ticketQueryString ? `?${ticketQueryString}` : ""}`;

  // Obtener tickets
  const {
    data: ticketsResponse,
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useQuery<
    Ticket[] | {
      data: Ticket[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  >({
    queryKey: ["tickets", ticketFilters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(ticketEndpoint);
      return response.data;
    },
    enabled: activeTab === "tickets",
  });

  // Construir query params para posts
  const postQueryParams = new URLSearchParams();
  if (postFilters.activo !== undefined) postQueryParams.append("activo", String(postFilters.activo));
  postQueryParams.append("page", String(postFilters.page));
  postQueryParams.append("limit", String(postFilters.limit));

  const postQueryString = postQueryParams.toString();
  const postEndpoint = `/comunicacion/posts${postQueryString ? `?${postQueryString}` : ""}`;

  // Obtener posts
  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<
    Post[] | {
      data: Post[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  >({
    queryKey: ["posts", postFilters],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(postEndpoint);
      return response.data;
    },
    enabled: activeTab === "foro",
  });

  // Manejar diferentes formatos de respuesta para tickets
  let tickets: Ticket[] = [];
  let ticketsTotal = 0;
  let ticketsCurrentPage = ticketFilters.page;
  let ticketsTotalPages = 0;
  let ticketsLimit = ticketFilters.limit;

  if (ticketsResponse) {
    if (Array.isArray(ticketsResponse)) {
      tickets = ticketsResponse;
      ticketsTotal = ticketsResponse.length;
      ticketsTotalPages = 1;
    } else if (ticketsResponse.data && Array.isArray(ticketsResponse.data)) {
      tickets = ticketsResponse.data;
      ticketsTotal = ticketsResponse.total ?? ticketsResponse.data.length;
      ticketsCurrentPage = ticketsResponse.page ?? ticketFilters.page;
      ticketsTotalPages = ticketsResponse.totalPages ?? Math.ceil(ticketsTotal / ticketsLimit);
      ticketsLimit = ticketsResponse.limit ?? ticketFilters.limit;
    }
  }

  // Manejar diferentes formatos de respuesta para posts
  let posts: Post[] = [];
  let postsTotal = 0;
  let postsCurrentPage = postFilters.page;
  let postsTotalPages = 0;
  let postsLimit = postFilters.limit;

  if (postsResponse) {
    if (Array.isArray(postsResponse)) {
      posts = postsResponse;
      postsTotal = postsResponse.length;
      postsTotalPages = 1;
    } else if (postsResponse.data && Array.isArray(postsResponse.data)) {
      posts = postsResponse.data;
      postsTotal = postsResponse.total ?? postsResponse.data.length;
      postsCurrentPage = postsResponse.page ?? postFilters.page;
      postsTotalPages = postsResponse.totalPages ?? Math.ceil(postsTotal / postsLimit);
      postsLimit = postsResponse.limit ?? postFilters.limit;
    }
  }

  // Mutación para eliminar ticket
  const eliminarTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/tickets/${ticketId}`);
    },
    onSuccess: () => {
      toast.success("Ticket eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el ticket";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para cambiar estado del ticket
  const cambiarEstadoTicketMutation = useMutation({
    mutationFn: async ({ ticketId, nuevoEstado }: { ticketId: string; nuevoEstado: TicketEstado }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.put(`/comunicacion/tickets/${ticketId}`, {
        estado: nuevoEstado,
      });
    },
    onSuccess: (_, variables) => {
      const estadoLabels: Record<TicketEstado, string> = {
        ABIERTO: "Abierto",
        EN_PROGRESO: "En Progreso",
        RESUELTO: "Resuelto",
        CERRADO: "Cerrado",
      };
      toast.success(`Ticket cambiado a "${estadoLabels[variables.nuevoEstado]}"`, {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al cambiar el estado del ticket";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para eliminar post
  const eliminarPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/posts/${postId}`);
    },
    onSuccess: () => {
      toast.success("Post eliminado exitosamente", {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el post";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para toggle like en post (legacy)
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPost) {
        queryClient.invalidateQueries({ queryKey: ["post-comentarios", selectedPost.id] });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al dar like";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para agregar/actualizar reacción
  const addReactionMutation = useMutation({
    mutationFn: async ({ postId, tipo }: { postId: string; tipo: ReactionType }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/posts/${postId}/reaction`, { tipo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPost) {
        queryClient.invalidateQueries({ queryKey: ["post-comentarios", selectedPost.id] });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al agregar reacción";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para eliminar reacción
  const removeReactionMutation = useMutation({
    mutationFn: async (postId: string) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/comunicacion/posts/${postId}/reaction`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPost) {
        queryClient.invalidateQueries({ queryKey: ["post-comentarios", selectedPost.id] });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar reacción";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Handlers para tickets
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setViewTicketDialogOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditTicketDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    eliminarTicketMutation.mutate(ticket.id);
  };

  const handleEstadoChange = (ticket: Ticket, nuevoEstado: TicketEstado) => {
    cambiarEstadoTicketMutation.mutate({
      ticketId: ticket.id,
      nuevoEstado,
    });
  };

  const handleTicketEstadoFilter = (estado: any) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      estado: estado || undefined,
      page: 1,
    }));
  };

  const handleTicketCategoriaFilter = (categoria: string | null) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      categoria: categoria || undefined,
      page: 1,
    }));
  };

  const handleTicketUnidadFilter = (unidadId: string | null) => {
    setTicketFilters((prev: TicketsFilters) => ({
      ...prev,
      unidadId: unidadId || undefined,
      page: 1,
    }));
  };

  const clearTicketFilters = () => {
    setTicketFilters({ page: 1, limit: 10 });
  };

  const handleTicketPageChange = (newPage: number) => {
    setTicketFilters((prev: TicketsFilters) => ({ ...prev, page: newPage }));
  };

  const handleTicketLimitChange = (newLimit: number) => {
    setTicketFilters((prev: TicketsFilters) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const activeTicketFiltersCount = [
    ticketFilters.estado,
    ticketFilters.categoria,
    ticketFilters.unidadId,
    ticketFilters.userId,
  ].filter((v) => v !== undefined).length;

  // Handlers para posts
  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setViewPostDialogOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setEditPostDialogOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    eliminarPostMutation.mutate(post.id);
  };

  const handleLikePost = (post: Post) => {
    toggleLikeMutation.mutate(post.id);
  };

  const handleReactionPost = (post: Post, reactionType: ReactionType | null) => {
    if (reactionType) {
      addReactionMutation.mutate({ postId: post.id, tipo: reactionType });
    } else {
      removeReactionMutation.mutate(post.id);
    }
  };

  const handlePostPageChange = (newPage: number) => {
    setPostFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePostLimitChange = (newLimit: number) => {
    setPostFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const isPostAuthor = (post: Post) => {
    return post.userId === currentUser?.id;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comunidad</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tickets de administración y el foro comunitario
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "tickets" ? "default" : "ghost"}
          onClick={() => setActiveTab("tickets")}
          className="gap-2"
        >
          <IconTicket className="size-4" />
          Tickets
        </Button>
        <Button
          variant={activeTab === "foro" ? "default" : "ghost"}
          onClick={() => setActiveTab("foro")}
          className="gap-2"
        >
          <IconMessageCircle className="size-4" />
          Foro
        </Button>
      </div>

      {/* Contenido de Tickets */}
      {activeTab === "tickets" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => setCreateTicketDialogOpen(true)}
                className="gap-2"
              >
                <IconCirclePlusFilled className="size-4" />
                Crear Ticket
              </Button>
            </div>
          </div>

          <TicketsFiltersComponent
            filters={ticketFilters}
            unidades={unidades.map((u) => ({
              id: u.id,
              identificador: u.identificador,
            }))}
            onEstadoFilter={handleTicketEstadoFilter}
            onCategoriaFilter={handleTicketCategoriaFilter}
            onUnidadFilter={handleTicketUnidadFilter}
            onClearFilters={clearTicketFilters}
            activeFiltersCount={activeTicketFiltersCount}
          />

          <TicketsTable
            tickets={tickets}
            isLoading={ticketsLoading}
            error={ticketsError}
            onView={handleViewTicket}
            onEdit={handleEditTicket}
            onDelete={handleDeleteTicket}
            onEstadoChange={handleEstadoChange}
            isAdmin={isAdmin}
            total={ticketsTotal}
            currentPage={ticketsCurrentPage}
            totalPages={ticketsTotalPages}
            limit={ticketsLimit}
            onPageChange={handleTicketPageChange}
            onLimitChange={handleTicketLimitChange}
          />

          <CreateTicketDialog
            open={createTicketDialogOpen}
            onOpenChange={setCreateTicketDialogOpen}
          />

          <ViewTicketDialog
            open={viewTicketDialogOpen}
            onOpenChange={(open) => {
              setViewTicketDialogOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            isAdmin={isAdmin}
          />

          <EditTicketDialog
            open={editTicketDialogOpen}
            onOpenChange={(open) => {
              setEditTicketDialogOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            isAdmin={isAdmin}
          />
        </>
      )}

      {/* Contenido de Foro */}
      {activeTab === "foro" && (
        <>
          {/* Botón flotante para crear post */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setCreatePostDialogOpen(true)}
              className="gap-2 shadow-lg"
              size="lg"
            >
              <IconCirclePlusFilled className="size-5" />
              Crear Publicación
            </Button>
          </div>

          <PostsList
            posts={posts}
            isLoading={postsLoading}
            error={postsError}
            onView={handleViewPost}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onLike={handleLikePost}
            onReaction={handleReactionPost}
            isAdmin={isAdmin}
            isAuthor={isPostAuthor}
            total={postsTotal}
            currentPage={postsCurrentPage}
            totalPages={postsTotalPages}
            limit={postsLimit}
            onPageChange={handlePostPageChange}
            onLimitChange={handlePostLimitChange}
          />

          <CreatePostDialog
            open={createPostDialogOpen}
            onOpenChange={setCreatePostDialogOpen}
          />

          <ViewPostDialog
            open={viewPostDialogOpen}
            onOpenChange={(open) => {
              setViewPostDialogOpen(open);
              if (!open) {
                setSelectedPost(null);
              }
            }}
            post={selectedPost}
            onLike={handleLikePost}
          />

          <EditPostDialog
            open={editPostDialogOpen}
            onOpenChange={(open) => {
              setEditPostDialogOpen(open);
              if (!open) {
                setSelectedPost(null);
              }
            }}
            post={selectedPost}
            isAdmin={isAdmin}
          />
        </>
      )}
    </div>
  );
}

export default ComunidadPage;
