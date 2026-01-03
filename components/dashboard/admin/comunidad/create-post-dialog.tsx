"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { Unidad } from "@/types/types";
import { IconPhoto, IconX, IconSend, IconFile, IconVideo, IconMusic } from "@tabler/icons-react";

const postSchema = z.object({
  titulo: z.string().optional(),
  contenido: z.string().min(1, "El contenido es requerido"),
  unidadId: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
}: CreatePostDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener usuario actual
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
    enabled: open,
  });

  // Obtener unidades
  const { data: unidades = [] } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      titulo: "",
      contenido: "",
      unidadId: "",
    },
  });

  const contenido = watch("contenido");
  const titulo = watch("titulo");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 10) {
      toast.error("Máximo 10 archivos por post");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file: File): string => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return "";
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <IconPhoto className="size-5" />;
    } else if (file.type.startsWith("video/")) {
      return <IconVideo className="size-5" />;
    } else if (file.type.startsWith("audio/")) {
      return <IconMusic className="size-5" />;
    }
    return <IconFile className="size-5" />;
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      // Crear FormData
      const formData = new FormData();
      
      if (data.titulo) {
        formData.append("titulo", data.titulo);
      }
      formData.append("contenido", data.contenido);
      
      if (data.unidadId) {
        formData.append("unidadId", data.unidadId);
      }

      // Agregar archivos
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await axiosInstance.post("/comunicacion/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post publicado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["posts"] });

      reset();
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el post";

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
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  const characterCount = contenido?.length || 0;
  const hasContent = contenido && contenido.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[600px] p-0 mt-8 gap-0">
        <DialogTitle className="sr-only">Crear Publicación</DialogTitle>
        {/* Header minimalista */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={loading}
          >
            <IconX className="size-5" />
          </button>
          <Button
            type="submit"
            form="create-post-form"
            disabled={loading || !hasContent}
            className="rounded-full px-6"
            size="sm"
          >
            {loading ? "Publicando..." : "Publicar"}
          </Button>
        </div>

        {/* Formulario */}
        <form
          id="create-post-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col"
        >
          <FieldGroup className="p-4 space-y-4">
            {/* Título opcional */}
            <Field>
              <input
                {...register("titulo")}
                placeholder="Título (opcional)"
                disabled={loading}
                className="w-full text-xl font-semibold bg-transparent border-0 outline-none placeholder:text-muted-foreground resize-none"
                maxLength={100}
              />
              {errors.titulo && (
                <FieldError>{errors.titulo.message}</FieldError>
              )}
            </Field>

            {/* Contenido principal */}
            <Field>
              <textarea
                {...register("contenido")}
                placeholder="¿Qué está pasando?"
                disabled={loading}
                className="w-full min-h-[200px] text-[15px] bg-transparent border-0 outline-none placeholder:text-muted-foreground resize-none"
                style={{ minHeight: "200px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 500)}px`;
                }}
              />
              {errors.contenido && (
                <FieldError>{errors.contenido.message}</FieldError>
              )}
            </Field>

            {/* Preview de archivos */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-border"
                  >
                    {file.type.startsWith("image/") ? (
                      <div className="relative">
                        <img
                          src={getFilePreview(file)}
                          alt={file.name}
                          className="w-full h-auto max-h-[300px] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconX className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <IconX className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selector de unidad */}
            {unidades.length > 0 && (
              <Field>
                <select
                  {...register("unidadId")}
                  disabled={loading}
                  className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Agregar ubicación (opcional)</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.identificador} - {unidad.tipo}
                    </option>
                  ))}
                </select>
                {errors.unidadId && (
                  <FieldError>{errors.unidadId.message}</FieldError>
                )}
              </Field>
            )}
          </FieldGroup>

          {/* Footer con acciones */}
          <div className="border-t border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="p-2 rounded-full hover:bg-primary/10 text-primary cursor-pointer transition-colors"
                title="Agregar archivos"
              >
                <IconPhoto className="size-5" />
              </label>
            </div>

            {hasContent && (
              <div className="text-xs text-muted-foreground">
                {characterCount} caracteres
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
