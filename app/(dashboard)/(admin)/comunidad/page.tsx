"use client";

import { useState } from "react";
import type { Post, ReactionType } from "@/types/types";
import { CreatePostDialog } from "@/components/dashboard/admin/comunidad/create-post-dialog";
import { ViewPostDialog } from "@/components/dashboard/admin/comunidad/view-post-dialog";
import { EditPostDialog } from "@/components/dashboard/admin/comunidad/edit-post-dialog";
import { SidebarNavegacion } from "@/components/dashboard/admin/comunidad/sidebar-navegacion";
import { SidebarUsuarios } from "@/components/dashboard/admin/comunidad/sidebar-usuarios";
import { HeaderComunidad } from "@/components/dashboard/admin/comunidad/header-comunidad";
import { ContenidoPrincipal } from "@/components/dashboard/admin/comunidad/contenido-principal";
import { usePostMutations } from "@/components/dashboard/admin/comunidad/post-mutations";
import { usePostQueries, useCurrentUser, useUsuariosSugeridos } from "@/components/dashboard/admin/comunidad/post-queries";

function ComunidadPage() {
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [viewPostDialogOpen, setViewPostDialogOpen] = useState(false);
  const [editPostDialogOpen, setEditPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<
    "inicio" | "explorar" | "notificaciones" | "mensajes" | "usuarios"
  >("inicio");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);

  // Filtros para posts
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 20,
    activo: true,
  });

  // Queries
  const currentUser = useCurrentUser();
  const usuarios = useUsuariosSugeridos();
  const {
    posts,
    postsTotal,
    postsCurrentPage,
    postsTotalPages,
    postsLimit,
    postsLoading,
    postsError,
  } = usePostQueries(postFilters);

  // Mutations
  const {
    eliminarPostMutation,
    toggleLikeMutation,
    addReactionMutation,
    removeReactionMutation,
  } = usePostMutations(selectedPost);

  const isAdmin = currentUser ? currentUser.role === "ADMIN" : true;

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

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 overflow-hidden">
      <SidebarNavegacion
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        onCreatePost={() => setCreatePostDialogOpen(true)}
        currentUser={currentUser}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
      />

      {/* Contenido Central - Feed */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <HeaderComunidad
          activeMenu={activeMenu}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Contenido según el menú activo */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ContenidoPrincipal
            activeMenu={activeMenu}
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
            selectedUserImage={selectedUserImage}
            posts={posts}
            postsLoading={postsLoading}
            postsError={postsError}
            postsTotal={postsTotal}
            postsCurrentPage={postsCurrentPage}
            postsTotalPages={postsTotalPages}
            postsLimit={postsLimit}
            onViewPost={handleViewPost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onLikePost={handleLikePost}
            onReactionPost={handleReactionPost}
            isAdmin={isAdmin}
            isPostAuthor={isPostAuthor}
            currentUser={currentUser}
            onUserClick={(userId, userName, userImage) => {
              setSelectedUserId(userId);
              setSelectedUserName(userName);
              setSelectedUserImage(userImage);
            }}
            onPostPageChange={handlePostPageChange}
            onPostLimitChange={handlePostLimitChange}
            onBackFromUserPosts={() => {
              setSelectedUserId(null);
              setSelectedUserName(null);
              setSelectedUserImage(null);
            }}
          />
        </div>
      </main>

      <SidebarUsuarios
        usuarios={usuarios}
        onUserClick={(userId, userName, userImage) => {
          setSelectedUserId(userId);
          setSelectedUserName(userName);
          setSelectedUserImage(userImage);
        }}
      />

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
