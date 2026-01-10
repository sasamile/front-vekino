"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import type { UpdatePostRequest } from "@/types/types";

const postSchema = z.object({
  titulo: z.string().optional(),
  contenido: z.string().min(1, "El contenido es requerido"),
  imagen: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
});

type PostFormData = z.infer<typeof postSchema>;

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: { id: string; titulo: string | null; contenido: string; imagen: string | null } | null;
  isAdmin?: boolean;
}

export function EditPostDialog({
  open,
  onOpenChange,
  post,
  isAdmin = false,
}: EditPostDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      titulo: "",
      contenido: "",
      imagen: "",
    },
  });

  // Actualizar formulario cuando cambia el post
  useEffect(() => {
    if (post) {
      reset({
        titulo: post.titulo || "",
        contenido: post.contenido,
        imagen: post.imagen || "",
      });
    }
  }, [post, reset]);

  const onSubmit = async (data: PostFormData) => {
    if (!post) return;

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      const requestData: UpdatePostRequest = {
        titulo: data.titulo || undefined,
        contenido: data.contenido,
        imagen: data.imagen || undefined,
      };

      await axiosInstance.put(`/comunicacion/posts/${post.id}`, requestData);

      toast.success("Post actualizado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["posts"] });

      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al actualizar el post";

      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onOpenChange(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Post</DialogTitle>
          <DialogDescription>
            Actualiza la información del post
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Título (Opcional)</FieldLabel>
              <Input
                {...register("titulo")}
                placeholder="Ej: ¿Alguien sabe si habrá mantenimiento?"
                disabled={loading}
              />
              {errors.titulo && (
                <FieldError>{errors.titulo.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Contenido *</FieldLabel>
              <textarea
                {...register("contenido")}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.contenido && (
                <FieldError>{errors.contenido.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>URL de Imagen (Opcional)</FieldLabel>
              <Input
                {...register("imagen")}
                type="url"
                placeholder="https://example.com/imagen.jpg"
                disabled={loading}
              />
              {errors.imagen && (
                <FieldError>{errors.imagen.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

