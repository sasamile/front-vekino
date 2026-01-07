"use client";

import type { Post, ReactionType } from "@/types/types";
import { PostsList } from "./posts-list";
import { ExplorarView } from "./explorar-view";
import { NotificacionesView } from "./notificaciones-view";
import { MensajesView } from "./mensajes-view";
import { UsuariosView } from "./usuarios-view";
import { UserPostsView } from "./user-posts-view";

type ActiveMenu = "inicio" | "explorar" | "notificaciones" | "mensajes" | "usuarios";

interface ContenidoPrincipalProps {
  activeMenu: ActiveMenu;
  selectedUserId: string | null;
  selectedUserName: string | null;
  selectedUserImage: string | null;
  posts: Post[];
  postsLoading: boolean;
  postsError: any;
  postsTotal: number;
  postsCurrentPage: number;
  postsTotalPages: number;
  postsLimit: number;
  onViewPost: (post: Post) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (post: Post) => void;
  onLikePost: (post: Post) => void;
  onReactionPost: (post: Post, reactionType: ReactionType | null) => void;
  isAdmin: boolean;
  isPostAuthor: (post: Post) => boolean;
  currentUser: any;
  onUserClick: (userId: string, userName: string | null, userImage: string | null) => void;
  onPostPageChange: (newPage: number) => void;
  onPostLimitChange: (newLimit: number) => void;
  onBackFromUserPosts: () => void;
}

export function ContenidoPrincipal({
  activeMenu,
  selectedUserId,
  selectedUserName,
  selectedUserImage,
  posts,
  postsLoading,
  postsError,
  postsTotal,
  postsCurrentPage,
  postsTotalPages,
  postsLimit,
  onViewPost,
  onEditPost,
  onDeletePost,
  onLikePost,
  onReactionPost,
  isAdmin,
  isPostAuthor,
  currentUser,
  onUserClick,
  onPostPageChange,
  onPostLimitChange,
  onBackFromUserPosts,
}: ContenidoPrincipalProps) {
  if (selectedUserId) {
    return (
      <UserPostsView
        userId={selectedUserId}
        userName={selectedUserName || undefined}
        userImage={selectedUserImage}
        onBack={onBackFromUserPosts}
        onView={onViewPost}
        onEdit={onEditPost}
        onDelete={onDeletePost}
        onLike={onLikePost}
        onReaction={onReactionPost}
        isAdmin={isAdmin}
        isAuthor={isPostAuthor}
        currentUser={currentUser}
      />
    );
  }

  return (
    <>
      {activeMenu === "inicio" && (
        <div className="h-full overflow-y-auto">
          <PostsList
            posts={posts}
            isLoading={postsLoading}
            error={postsError}
            onView={onViewPost}
            onEdit={onEditPost}
            onDelete={onDeletePost}
            onLike={onLikePost}
            onReaction={onReactionPost}
            isAdmin={isAdmin}
            isAuthor={isPostAuthor}
            currentUser={currentUser}
            onUserClick={onUserClick}
            total={postsTotal}
            currentPage={postsCurrentPage}
            totalPages={postsTotalPages}
            limit={postsLimit}
            onPageChange={onPostPageChange}
            onLimitChange={onPostLimitChange}
          />
        </div>
      )}

      {activeMenu === "explorar" && (
        <ExplorarView
          onView={onViewPost}
          onEdit={onEditPost}
          onDelete={onDeletePost}
          onLike={onLikePost}
          onReaction={onReactionPost}
          isAdmin={isAdmin}
          isAuthor={isPostAuthor}
          currentUser={currentUser}
          onUserClick={onUserClick}
        />
      )}

      {activeMenu === "notificaciones" && <NotificacionesView />}

      {activeMenu === "mensajes" && <MensajesView />}

      {activeMenu === "usuarios" && (
        <UsuariosView onUserClick={onUserClick} />
      )}
    </>
  );
}


