"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import type { ResidenteRole, TipoDocumento, CreateResidenteRequest, Unidad, UnidadTipo, UnidadEstado, CreateUnidadRequest } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { CreateUnidadQuickDialog } from "./create-unidad-quick-dialog";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const residenteSchema = z.object({
  name: z.string().min(1, "El nombre completo es requerido"),
  email: z.string().email("El email debe ser válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "PROPIETARIO", "ARRENDATARIO", "RESIDENTE"], {
    message: "El rol es requerido",
  }),
  firstName: z.string().min(1, "El primer nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  tipoDocumento: z.enum(["CC", "CE", "NIT", "PASAPORTE", "OTRO"], {
    message: "El tipo de documento es requerido",
  }),
  numeroDocumento: z.string().min(1, "El número de documento es requerido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  unidadId: z.string().min(1, "Debes seleccionar una unidad"),
});

type ResidenteFormData = z.infer<typeof residenteSchema>;

interface CreateResidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: { value: ResidenteRole; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "RESIDENTE", label: "Residente" },
];

const DOCUMENTO_OPTIONS: { value: TipoDocumento; label: string }[] = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO", label: "Otro" },
];

export function CreateResidenteDialog({
  open,
  onOpenChange,
}: CreateResidenteDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const [createUnidadDialogOpen, setCreateUnidadDialogOpen] = useState(false);
  const [creatingUnidad, setCreatingUnidad] = useState(false);
  const [unidadComboboxOpen, setUnidadComboboxOpen] = useState(false);

  // Obtener unidades para el selector
  const { data: unidades = [], refetch: refetchUnidades } = useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/unidades");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ResidenteFormData>({
    resolver: zodResolver(residenteSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "RESIDENTE",
      firstName: "",
      lastName: "",
      tipoDocumento: "CC",
      numeroDocumento: "",
      telefono: "",
      unidadId: "",
    },
  });

  const onSubmit = async (data: ResidenteFormData) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const requestData: CreateResidenteRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        telefono: data.telefono,
        unidadId: data.unidadId,
      };

      await axiosInstance.post("/condominios/users", requestData);

      toast.success("Residente creado exitosamente", {
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: ["unidades-with-residentes"] });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el residente";

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

  const handleCreateUnidad = async (unidadData: {
    identificador: string;
    tipo: UnidadTipo;
    area: number;
    coeficienteCopropiedad: number;
    valorCuotaAdministracion: number;
    estado: UnidadEstado;
  }) => {
    setCreatingUnidad(true);
    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const requestData: CreateUnidadRequest = unidadData;
      const response = await axiosInstance.post("/unidades", requestData);
      const nuevaUnidad = response.data;

      toast.success("Unidad creada exitosamente", {
        duration: 2000,
      });

      await refetchUnidades();

      if (nuevaUnidad?.id) {
        setValue("unidadId", nuevaUnidad.id, { shouldValidate: true });
      }

      setCreateUnidadDialogOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear la unidad";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setCreatingUnidad(false);
    }
  };

  const selectedUnidadId = watch("unidadId");
  const selectedUnidad = selectedUnidadId
    ? unidades.find((unidad) => unidad.id === selectedUnidadId)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Residente</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo residente en el condominio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Primer Nombre *</FieldLabel>
                <Input
                  {...register("firstName")}
                  placeholder="Ej: Juan"
                  disabled={loading}
                />
                {errors.firstName && (
                  <FieldError>{errors.firstName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Apellido *</FieldLabel>
                <Input
                  {...register("lastName")}
                  placeholder="Ej: Pérez"
                  disabled={loading}
                />
                {errors.lastName && (
                  <FieldError>{errors.lastName.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Nombre Completo *</FieldLabel>
              <Input
                {...register("name")}
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
              {errors.name && (
                <FieldError>{errors.name.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Email *</FieldLabel>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="Ej: juan.perez@email.com"
                  disabled={loading}
                />
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Rol *</FieldLabel>
                <select
                  {...register("role")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <FieldError>{errors.role.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Unidad *</FieldLabel>
                <Popover open={unidadComboboxOpen} onOpenChange={setUnidadComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={unidadComboboxOpen}
                      disabled={loading || unidades.length === 0}
                      className="w-full justify-between py-5"
                    >
                      {selectedUnidad
                        ? `${selectedUnidad.identificador} - ${selectedUnidad.tipo}`
                        : unidades.length === 0
                        ? "Cargando unidades..."
                        : "Selecciona una unidad..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar unidad..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No se encontraron unidades.</CommandEmpty>
                        <CommandGroup>
                          {unidades.map((unidad) => (
                            <CommandItem
                              key={unidad.id}
                              value={`${unidad.identificador} ${unidad.tipo}`}
                              onSelect={() => {
                                setValue("unidadId", unidad.id, { shouldValidate: true });
                                setUnidadComboboxOpen(false);
                              }}
                            >
                              {unidad.identificador} - {unidad.tipo}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedUnidadId === unidad.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setUnidadComboboxOpen(false);
                              setCreateUnidadDialogOpen(true);
                            }}
                            className="border-t"
                          >
                            <IconPlus className="mr-2 h-4 w-4" />
                            Crear nueva unidad
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.unidadId && (
                  <FieldError>{errors.unidadId.message}</FieldError>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Tipo de Documento *</FieldLabel>
                <select
                  {...register("tipoDocumento")}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {DOCUMENTO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tipoDocumento && (
                  <FieldError>{errors.tipoDocumento.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Número de Documento *</FieldLabel>
                <Input
                  {...register("numeroDocumento")}
                  placeholder="Ej: 1234567890"
                  disabled={loading}
                />
                {errors.numeroDocumento && (
                  <FieldError>{errors.numeroDocumento.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Teléfono *</FieldLabel>
              <Input
                {...register("telefono")}
                placeholder="Ej: 3001234567"
                disabled={loading}
              />
              {errors.telefono && (
                <FieldError>{errors.telefono.message}</FieldError>
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
              {loading ? "Creando..." : "Crear Residente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CreateUnidadQuickDialog
        open={createUnidadDialogOpen}
        onOpenChange={setCreateUnidadDialogOpen}
        onCreate={handleCreateUnidad}
        loading={creatingUnidad}
      />
    </Dialog>
  );
}

