"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import type { Post, ReactionType } from "@/types/types";

export function usePostMutations(selectedPost: Post | null) {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();

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

  return {
    eliminarPostMutation,
    toggleLikeMutation,
    addReactionMutation,
    removeReactionMutation,
  };
}


