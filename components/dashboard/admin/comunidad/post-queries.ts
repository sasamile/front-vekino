"use client";

import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import type { Post } from "@/types/types";

interface PostFilters {
  page: number;
  limit: number;
  activo?: boolean;
}

export function usePostQueries(postFilters: PostFilters) {
  const { subdomain } = useSubdomain();

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

  return {
    posts,
    postsTotal,
    postsCurrentPage,
    postsTotalPages,
    postsLimit,
    postsLoading,
    postsError,
  };
}

export function useCurrentUser() {
  const { subdomain } = useSubdomain();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
  });

  return currentUser;
}

export function useUsuariosSugeridos() {
  const { subdomain } = useSubdomain();

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

  return usuariosResponse?.data || [];
}


