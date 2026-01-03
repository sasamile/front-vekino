"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Field,
  FieldGroup,
  FieldError,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import type { CreatePostRequest, Unidad } from "@/types/types";
import { IconPhoto, IconX, IconSend } from "@tabler/icons-react";

const postSchema = z.object({
  titulo: z.string().optional(),
  contenido: z.string().min(1, "El contenido es requerido"),
  imagen: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
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
  const [imagenPreview, setImagenPreview] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);

  // Obtener usuario actual
  useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      setCurrentUser({ name: response.data.name || "Usuario", id: response.data.id });
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
      imagen: "",
      unidadId: "",
    },
  });

  const imagenUrl = watch("imagen");
  const contenido = watch("contenido");

  // Actualizar preview cuando cambia la URL
  useEffect(() => {
    if (imagenUrl && imagenUrl.trim() !== "") {
      setImagenPreview(imagenUrl);
    } else {
      setImagenPreview("");
    }
  }, [imagenUrl]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      
      const requestData: CreatePostRequest = {
        titulo: data.titulo || undefined,
        contenido: data.contenido,
        imagen: data.imagen || undefined,
        unidadId: data.unidadId || undefined,
      };

      await axiosInstance.post("/comunicacion/posts", requestData);

      toast.success("Post publicado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["posts"] });

      reset();
      setImagenPreview("");
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
      setImagenPreview("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Publicación</DialogTitle>
          <DialogDescription>
            Comparte algo con la comunidad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Preview del post */}
          {(contenido || imagenPreview) && (
            <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {currentUser ? getInitials(currentUser.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">
                    {currentUser?.name || "Tú"}
                  </div>
                  <div className="text-xs text-muted-foreground">Ahora</div>
                </div>
              </div>
              {watch("titulo") && (
                <h3 className="font-semibold text-base">{watch("titulo")}</h3>
              )}
              {contenido && (
                <p className="text-sm whitespace-pre-wrap">{contenido}</p>
              )}
              {imagenPreview && (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                    onError={() => {
                      setImagenPreview("");
                      toast.error("No se pudo cargar la imagen");
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <FieldGroup>
            <Field>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {currentUser ? getInitials(currentUser.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    {...register("titulo")}
                    placeholder="¿En qué estás pensando? (opcional)"
                    disabled={loading}
                    className="border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  />
                </div>
              </div>
              {errors.titulo && (
                <FieldError>{errors.titulo.message}</FieldError>
              )}
            </Field>

            <Field>
              <textarea
                {...register("contenido")}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                style={{ minHeight: "120px" }}
              />
              {errors.contenido && (
                <FieldError>{errors.contenido.message}</FieldError>
              )}
            </Field>

            <Field>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 border rounded-md px-3 py-2">
                    <IconPhoto className="size-5 text-muted-foreground" />
                    <Input
                      {...register("imagen")}
                      type="url"
                      placeholder="Pega la URL de una imagen..."
                      disabled={loading}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                    {imagenPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          reset({ ...watch(), imagen: "" });
                          setImagenPreview("");
                        }}
                      >
                        <IconX className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {imagenPreview && (
                  <div className="relative rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={imagenPreview}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain"
                      onError={() => {
                        setImagenPreview("");
                        toast.error("No se pudo cargar la imagen");
                      }}
                    />
                  </div>
                )}
              </div>
              {errors.imagen && (
                <FieldError>{errors.imagen.message}</FieldError>
              )}
            </Field>

            <Field>
              <select
                {...register("unidadId")}
                disabled={loading || unidades.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {unidades.length === 0 ? "Cargando unidades..." : "Agregar ubicación (opcional)"}
                </option>
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
          </FieldGroup>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !contenido}
              className="gap-2"
            >
              <IconSend className="size-4" />
              {loading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
