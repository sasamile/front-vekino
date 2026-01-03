"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Post, ReactionType } from "@/types/types";
import { PostsList } from "@/components/dashboard/admin/comunidad/posts-list";
import { CreatePostDialog } from "@/components/dashboard/admin/comunidad/create-post-dialog";
import { ViewPostDialog } from "@/components/dashboard/admin/comunidad/view-post-dialog";
import { EditPostDialog } from "@/components/dashboard/admin/comunidad/edit-post-dialog";
import { ExplorarView } from "@/components/dashboard/admin/comunidad/explorar-view";
import { NotificacionesView } from "@/components/dashboard/admin/comunidad/notificaciones-view";
import { MensajesView } from "@/components/dashboard/admin/comunidad/mensajes-view";
import { UsuariosView } from "@/components/dashboard/admin/comunidad/usuarios-view";
import { UserPostsView } from "@/components/dashboard/admin/comunidad/user-posts-view";
import {
  IconHome,
  IconSearch,
  IconBell,
  IconMail,
  IconUser,
  IconSettings,
  IconCirclePlusFilled,
  IconMessageCircle,
  IconUsers,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

function ComunidadPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [viewPostDialogOpen, setViewPostDialogOpen] = useState(false);
  const [editPostDialogOpen, setEditPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtros para posts
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 20,
    activo: true,
  });

  // Obtener usuario actual
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
  });

  // Obtener usuarios para el sidebar derecho
  const { data: usuariosResponse } = useQuery({
    queryKey: ["comunicacion-usuarios"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(
        "/comunicacion/usuarios?limit=5"
      );
      return response.data;
    },
  });

  const usuarios = usuariosResponse?.data || [];

  const isAdmin = currentUser ? currentUser.role === "ADMIN" : true;

  // Construir query params para posts
  const postQueryParams = new URLSearchParams();
  if (postFilters.activo !== undefined)
    postQueryParams.append("activo", String(postFilters.activo));
  postQueryParams.append("page", String(postFilters.page));
  postQueryParams.append("limit", String(postFilters.limit));

  const postQueryString = postQueryParams.toString();
  const postEndpoint = `/comunicacion/posts${
    postQueryString ? `?${postQueryString}` : ""
  }`;

  // Obtener posts
  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<
    | Post[]
    | {
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
  });

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
      postsTotalPages =
        postsResponse.totalPages ?? Math.ceil(postsTotal / postsLimit);
      postsLimit = postsResponse.limit ?? postFilters.limit;
    }
  }

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
        queryClient.invalidateQueries({
          queryKey: ["post-comentarios", selectedPost.id],
        });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Error al dar like";
      toast.error(errorMessage, {
        duration: 3000,
      });
    },
  });

  // Mutación para agregar/actualizar reacción
  const addReactionMutation = useMutation({
    mutationFn: async ({
      postId,
      tipo,
    }: {
      postId: string;
      tipo: ReactionType;
    }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.post(`/comunicacion/posts/${postId}/reaction`, {
        tipo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPost) {
        queryClient.invalidateQueries({
          queryKey: ["post-comentarios", selectedPost.id],
        });
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
        queryClient.invalidateQueries({
          queryKey: ["post-comentarios", selectedPost.id],
        });
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

  const handleReactionPost = (
    post: Post,
    reactionType: ReactionType | null
  ) => {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear nombre del condominio desde el subdomain
  const condominioName = subdomain
    ? subdomain
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Comunidad";

  const [activeMenu, setActiveMenu] = useState<
    "inicio" | "explorar" | "notificaciones" | "mensajes" | "usuarios"
  >("inicio");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 overflow-hidden">
      {/* Sidebar Izquierdo - Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Izquierdo */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[275px] border-r border-border flex-col shrink-0 bg-background transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo/Navegación */}
        <div className="p-4 h-full flex flex-col">
        

          {/* Menú de navegación */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveMenu("inicio");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "inicio"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconHome className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Inicio</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("explorar");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "explorar"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconSearch className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Explorar</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu("notificaciones");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "notificaciones"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconBell className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">
                Notificaciones
              </span>
            </button>
          
            <button
              onClick={() => {
                setActiveMenu("usuarios");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                activeMenu === "usuarios"
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              }`}
            >
              <IconUsers className="size-6 shrink-0" />
              <span className="text-[15px] font-medium truncate">Usuarios</span>
            </button>
          </nav>

          {/* Botón Publicar */}
          <Button
            onClick={() => setCreatePostDialogOpen(true)}
            className="w-full mt-4 rounded-full h-12 text-[15px] font-semibold"
            size="lg"
          >
            <IconCirclePlusFilled className="size-5 mr-2" />
            Publicar
          </Button>
        </div>

        {/* Perfil del usuario en la parte inferior */}
        <div className="mt-auto p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-muted transition-colors cursor-pointer">
            <Avatar className="h-10 w-10 shrink-0">
              {currentUser?.image && (
                <AvatarImage src={currentUser.image} alt={currentUser.name || "Usuario"} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {currentUser
                  ? getInitials(currentUser.name || currentUser.email || "U")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] truncate">
                {currentUser?.name ||
                  currentUser?.email?.split("@")[0] ||
                  "Usuario"}
              </div>
              <div className="text-[13px] text-muted-foreground truncate">
                @{currentUser?.email?.split("@")[0] || "usuario"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Central - Feed */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            >
              <IconMenu2 className="size-5" />
            </button>
            <h1 className="text-xl font-bold truncate">
              {activeMenu === "inicio" && "Inicio"}
              {activeMenu === "explorar" && "Explorar"}
              {activeMenu === "notificaciones" && "Notificaciones"}
              {activeMenu === "mensajes" && "Mensajes"}
              {activeMenu === "usuarios" && "Usuarios"}
            </h1>
          </div>
        </div>

        {/* Contenido según el menú activo */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {selectedUserId ? (
            <UserPostsView
              userId={selectedUserId}
              userName={selectedUserName || undefined}
              userImage={selectedUserImage}
              onBack={() => {
                setSelectedUserId(null);
                setSelectedUserName(null);
                setSelectedUserImage(null);
              }}
              onView={handleViewPost}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onLike={handleLikePost}
              onReaction={handleReactionPost}
              isAdmin={isAdmin}
              isAuthor={isPostAuthor}
              currentUser={currentUser}
            />
          ) : (
            <>
              {activeMenu === "inicio" && (
                <div className="h-full overflow-y-auto">
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
                    currentUser={currentUser}
                    onUserClick={(userId, userName, userImage) => {
                      setSelectedUserId(userId);
                      setSelectedUserName(userName);
                      setSelectedUserImage(userImage);
                    }}
                    total={postsTotal}
                    currentPage={postsCurrentPage}
                    totalPages={postsTotalPages}
                    limit={postsLimit}
                    onPageChange={handlePostPageChange}
                    onLimitChange={handlePostLimitChange}
                  />
                </div>
              )}

              {activeMenu === "explorar" && (
                <ExplorarView
                  onView={handleViewPost}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onLike={handleLikePost}
                  onReaction={handleReactionPost}
                  isAdmin={isAdmin}
                  isAuthor={isPostAuthor}
                  currentUser={currentUser}
                  onUserClick={(userId, userName, userImage) => {
                    setSelectedUserId(userId);
                    setSelectedUserName(userName);
                    setSelectedUserImage(userImage);
                  }}
                />
              )}

              {activeMenu === "notificaciones" && <NotificacionesView />}

              {activeMenu === "mensajes" && <MensajesView />}

              {activeMenu === "usuarios" && (
                <UsuariosView
                  onUserClick={(userId, userName, userImage) => {
                    setSelectedUserId(userId);
                    setSelectedUserName(userName);
                    setSelectedUserImage(userImage);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Sidebar Derecho */}
      <aside className="hidden lg:flex w-[350px] border-l border-border p-4 overflow-y-auto shrink-0">
        {/* Buscador */}

        {/* Usuarios sugeridos */}
        {usuarios.length > 0 && (
          <div className="bg-muted/50 rounded-2xl p-4 mb-6 w-full">
            <h2 className="text-xl font-bold mb-4">Usuarios sugeridos</h2>
            <div className="space-y-4">
              {usuarios.slice(0, 3).map((usuario: any) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                  onClick={() => {
                    setSelectedUserId(usuario.id);
                    setSelectedUserName(usuario.name || null);
                    setSelectedUserImage(usuario.image || null);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      {usuario.image && (
                        <AvatarImage src={usuario.image} alt={usuario.name || "Usuario"} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(usuario.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] truncate max-w-[150px]">
                        {usuario.name || "Usuario"}
                      </div>
                      <div className="text-[13px] text-muted-foreground truncate max-w-[150px]">
                        @{usuario.email?.split("@")[0] || "usuario"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
      </aside>

      {/* Dialogs */}
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
        isAdmin={isAdmin}
        currentUser={currentUser}
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
    </div>
  );
}

export default ComunidadPage;
