"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
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
  FieldSet,
} from "@/components/ui/field";
import { getAxiosInstance } from "@/lib/axios-config";
import { useQueryClient } from "@tanstack/react-query";

const usuarioSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido").min(1, "El email es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  telefono: z.string().optional(),
  tipoDocumento: z.string().optional(),
  numeroDocumento: z.string().optional(),
  role: z.enum(["ADMIN", "PROPIETARIO", "ARRENDATARIO", "RESIDENTE"]),
  active: z.string(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "RESIDENTE", label: "Residente" },
];

const TIPO_DOCUMENTO = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de Identidad" },
];

interface CreateUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominioId: string | null;
}

export function CreateUsuarioDialog({
  open,
  onOpenChange,
  condominioId,
}: CreateUsuarioDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      role: "RESIDENTE",
      active: "true",
    },
  });

  const onSubmit = async (data: UsuarioFormData) => {
    if (!condominioId) {
      toast.error("Debes seleccionar un condominio primero");
      return;
    }

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(null);

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email,
        password: data.password,
        telefono: data.telefono || null,
        tipoDocumento: data.tipoDocumento || null,
        numeroDocumento: data.numeroDocumento || null,
        role: data.role,
        active: data.active === "true",
      };

      await axiosInstance.post(`/condominios/${condominioId}/users`, payload);

      toast.success("Usuario creado exitosamente", {
        duration: 3000,
      });

      // Invalidar y revalidar las queries para actualizar los datos
      await queryClient.invalidateQueries({
        queryKey: ["usuarios", condominioId],
      });

      reset();
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error al crear usuario";

      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo usuario en el condominio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel>Nombre *</FieldLabel>
                <Input
                  {...register("firstName")}
                  placeholder="Juan"
                  disabled={loading}
                />
                {errors.firstName && (
                  <FieldError>{errors.firstName.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.lastName}>
                <FieldLabel>Apellido</FieldLabel>
                <Input
                  {...register("lastName")}
                  placeholder="Pérez"
                  disabled={loading}
                />
                {errors.lastName && (
                  <FieldError>{errors.lastName.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel>Email *</FieldLabel>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="usuario@ejemplo.com"
                  disabled={loading}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel>Contraseña *</FieldLabel>
                <Input
                  type="password"
                  {...register("password")}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.telefono}>
                <FieldLabel>Teléfono</FieldLabel>
                <Input
                  type="tel"
                  {...register("telefono")}
                  placeholder="+57 300 123 4567"
                  disabled={loading}
                />
                {errors.telefono && (
                  <FieldError>{errors.telefono.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.tipoDocumento}>
                <FieldLabel>Tipo de Documento</FieldLabel>
                <select
                  {...register("tipoDocumento")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">Seleccionar...</option>
                  {TIPO_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                {errors.tipoDocumento && (
                  <FieldError>{errors.tipoDocumento.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.numeroDocumento}>
                <FieldLabel>Número de Documento</FieldLabel>
                <Input
                  {...register("numeroDocumento")}
                  placeholder="1234567890"
                  disabled={loading}
                />
                {errors.numeroDocumento && (
                  <FieldError>{errors.numeroDocumento.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.role}>
                <FieldLabel>Rol *</FieldLabel>
                <select
                  {...register("role")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && <FieldError>{errors.role.message}</FieldError>}
              </Field>
            </div>

            <FieldSet>
              <FieldLabel>Estado *</FieldLabel>
              <FieldGroup className="flex flex-col gap-2">
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="active-true"
                    {...register("active")}
                    value="true"
                    defaultChecked={true}
                    className="size-4"
                    disabled={loading}
                  />
                  <FieldLabel htmlFor="active-true" className="font-normal">
                    Activo
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="active-false"
                    {...register("active")}
                    value="false"
                    className="size-4"
                    disabled={loading}
                  />
                  <FieldLabel htmlFor="active-false" className="font-normal">
                    Inactivo
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !condominioId}>
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

