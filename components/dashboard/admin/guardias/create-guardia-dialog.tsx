"use client";

import { useState } from "react";
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
import type { ResidenteRole, TipoDocumento, CreateResidenteRequest } from "@/types/types";

const guardiaSchema = z.object({
    name: z.string().min(1, "El nombre completo es requerido"),
    email: z.string().email("El email debe ser válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    firstName: z.string().min(1, "El primer nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    tipoDocumento: z.enum(["CC", "CE", "NIT", "PASAPORTE", "OTRO"], {
        message: "El tipo de documento es requerido",
    }),
    numeroDocumento: z.string().min(1, "El número de documento es requerido"),
    telefono: z.string().optional(),
});

type GuardiaFormData = z.infer<typeof guardiaSchema>;

interface CreateGuardiaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DOCUMENTO_OPTIONS: { value: TipoDocumento; label: string }[] = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" },
    { value: "PASAPORTE", label: "Pasaporte" },
    { value: "OTRO", label: "Otro" },
];

export function CreateGuardiaDialog({
    open,
    onOpenChange,
}: CreateGuardiaDialogProps) {
    const queryClient = useQueryClient();
    const { subdomain } = useSubdomain();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<GuardiaFormData>({
        resolver: zodResolver(guardiaSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            tipoDocumento: "CC",
            numeroDocumento: "",
            telefono: "",
        },
    });

    const onSubmit = async (data: GuardiaFormData) => {
        setLoading(true);

        try {
            const axiosInstance = getAxiosInstance(subdomain);
            // The endpoint requires CreateResidenteRequest structure but for guards
            const requestData: CreateResidenteRequest = {
                name: data.name,
                email: data.email,
                password: data.password,
                role: "GUARDIA_SEGURIDAD", // Hardcoded role
                firstName: data.firstName,
                lastName: data.lastName,
                tipoDocumento: data.tipoDocumento,
                numeroDocumento: data.numeroDocumento,
                telefono: data.telefono || "",
                unidadId: "", // Not required for guards
            };

            await axiosInstance.post("/condominios/guardias-seguridad", requestData);

            toast.success("Guardia creado exitosamente", {
                duration: 2000,
            });

            await queryClient.invalidateQueries({ queryKey: ["guardias"] });

            reset();
            onOpenChange(false);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Error al crear el guardia";

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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Guardia de Seguridad</DialogTitle>
                    <DialogDescription>
                        Completa el formulario para registrar un nuevo guardia en el condominio
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
                            <FieldLabel>Teléfono</FieldLabel>
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
                            {loading ? "Creando..." : "Crear Guardia"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
