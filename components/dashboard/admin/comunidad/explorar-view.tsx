"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Input } from "@/components/ui/input";
import { PostsList } from "./posts-list";
import type { Post, ReactionType } from "@/types/types";
import { IconSearch } from "@tabler/icons-react";

interface ExplorarViewProps {
  onView: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onLike: (post: Post) => void;
  onReaction: (post: Post, reactionType: ReactionType | null) => void;
  isAdmin: boolean;
  isAuthor: (post: Post) => boolean;
  currentUser?: { id: string; role?: string } | null;
  onUserClick?: (userId: string, userName: string, userImage: string | null) => void;
}

export function ExplorarView({
  onView,
  onEdit,
  onDelete,
  onLike,
  onReaction,
  isAdmin,
  isAuthor,
  currentUser,
  onUserClick,
}: ExplorarViewProps) {
  const { subdomain } = useSubdomain();
  const [searchQuery, setSearchQuery] = useState("");
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 20,
    activo: true,
  });

  // Construir query params para posts con búsqueda
  const postQueryParams = new URLSearchParams();
  if (postFilters.activo !== undefined)
    postQueryParams.append("activo", String(postFilters.activo));
  if (searchQuery.trim()) {
    postQueryParams.append("search", searchQuery.trim());
  }
  postQueryParams.append("page", String(postFilters.page));
  postQueryParams.append("limit", String(postFilters.limit));

  const postQueryString = postQueryParams.toString();
  const postEndpoint = `/comunicacion/posts${
    postQueryString ? `?${postQueryString}` : ""
  }`;

  // Obtener posts con búsqueda
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
    queryKey: ["posts-explorar", postFilters, searchQuery],
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPostFilters((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
          <Input
            type="text"
            placeholder="Buscar posts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Lista de posts */}
      <div className="flex-1 overflow-y-auto">
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
          onUserClick={onUserClick}
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

