"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostsList } from "./posts-list";
import type { Post, ReactionType } from "@/types/types";
import { IconArrowLeft, IconUser } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface UserPostsViewProps {
  userId: string;
  userName?: string;
  userImage?: string | null;
  onBack: () => void;
  onView: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onLike: (post: Post) => void;
  onReaction: (post: Post, reactionType: ReactionType | null) => void;
  isAdmin: boolean;
  isAuthor: (post: Post) => boolean;
  currentUser?: { id: string; role?: string } | null;
}

export function UserPostsView({
  userId,
  userName,
  userImage,
  onBack,
  onView,
  onEdit,
  onDelete,
  onLike,
  onReaction,
  isAdmin,
  isAuthor,
  currentUser,
}: UserPostsViewProps) {
  const { subdomain } = useSubdomain();
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 20,
    activo: true,
  });

  // Obtener información completa del usuario
  const { data: userInfo } = useQuery({
    queryKey: ["usuario-info", userId],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      try {
        const response = await axiosInstance.get(`/comunicacion/usuarios/${userId}`);
        return response.data;
      } catch (error) {
        // Si no existe el endpoint, usar la info que ya tenemos
        return null;
      }
    },
    retry: false,
  });

  const displayName = userInfo?.name || userName || "Usuario";
  const displayImage = userInfo?.image || userImage;
  const displayEmail = userInfo?.email;

  // Construir query params para posts del usuario usando el nuevo endpoint
  const postQueryParams = new URLSearchParams();
  if (postFilters.activo !== undefined)
    postQueryParams.append("activo", String(postFilters.activo));
  postQueryParams.append("page", String(postFilters.page));
  postQueryParams.append("limit", String(postFilters.limit));

  const postQueryString = postQueryParams.toString();
  const postEndpoint = `/comunicacion/posts/usuario/${userId}${
    postQueryString ? `?${postQueryString}` : ""
  }`;

  // Obtener posts del usuario
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
    queryKey: ["posts-usuario", userId, postFilters],
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

  const handlePostPageChange = (newPage: number) => {
    setPostFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePostLimitChange = (newLimit: number) => {
    setPostFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header con información del usuario */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 -ml-2"
          >
            <IconArrowLeft className="size-5" />
          </Button>
          <Avatar className="h-12 w-12 shrink-0">
            {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{displayName}</h1>
            {displayEmail && (
              <p className="text-sm text-muted-foreground truncate">
                @{displayEmail.split("@")[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {postsTotal} {postsTotal === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de posts */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <PostsList
          posts={posts}
          isLoading={postsLoading}
          error={postsError}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onLike={onLike}
          onReaction={onReaction}
          isAdmin={isAdmin}
          isAuthor={isAuthor}
          currentUser={currentUser}
          total={postsTotal}
          currentPage={postsCurrentPage}
          totalPages={postsTotalPages}
          limit={postsLimit}
          onPageChange={handlePostPageChange}
          onLimitChange={handlePostLimitChange}
        />
      </div>
    </div>
  );
}

