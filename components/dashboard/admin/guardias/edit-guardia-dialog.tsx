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
import type { TipoDocumento, Residente } from "@/types/types";

const guardiaUpdateSchema = z.object({
    name: z.string().min(1, "El nombre completo es requerido").optional().or(z.literal("")),
    email: z.string().email("El email debe ser válido").optional().or(z.literal("")),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
    firstName: z.string().min(1, "El primer nombre es requerido").optional().or(z.literal("")),
    lastName: z.string().min(1, "El apellido es requerido").optional().or(z.literal("")),
    tipoDocumento: z.enum(["CC", "CE", "NIT", "PASAPORTE", "OTRO"]).optional(),
    numeroDocumento: z.string().min(1, "El número de documento es requerido").optional().or(z.literal("")),
    telefono: z.string().min(1, "El teléfono es requerido").optional().or(z.literal("")),
});

type GuardiaUpdateFormData = z.infer<typeof guardiaUpdateSchema>;

interface EditGuardiaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    guardia: Residente | null;
}

const DOCUMENTO_OPTIONS: { value: TipoDocumento; label: string }[] = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" },
    { value: "PASAPORTE", label: "Pasaporte" },
    { value: "OTRO", label: "Otro" },
];

export function EditGuardiaDialog({
    open,
    onOpenChange,
    guardia,
}: EditGuardiaDialogProps) {
    const queryClient = useQueryClient();
    const { subdomain } = useSubdomain();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<GuardiaUpdateFormData>({
        resolver: zodResolver(guardiaUpdateSchema),
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

    // Actualizar el formulario cuando cambia el guardia
    useEffect(() => {
        if (guardia) {
            reset({
                name: guardia.name,
                email: guardia.email,
                password: "",
                firstName: guardia.firstName,
                lastName: guardia.lastName,
                tipoDocumento: guardia.tipoDocumento,
                numeroDocumento: guardia.numeroDocumento,
                telefono: guardia.telefono,
            });
        }
    }, [guardia, reset]);

    const onSubmit = async (data: GuardiaUpdateFormData) => {
        if (!guardia) return;

        setLoading(true);

        try {
            const axiosInstance = getAxiosInstance(subdomain);

            // Solo enviar los campos que han cambiado y no están vacíos
            const updateData: Record<string, any> = {};

            if (data.name !== undefined && data.name !== "" && data.name !== guardia.name) {
                updateData.name = data.name;
            }
            if (data.email !== undefined && data.email !== "" && data.email !== guardia.email) {
                updateData.email = data.email;
            }
            if (data.password !== undefined && data.password !== "") {
                updateData.password = data.password;
            }
            if (data.firstName !== undefined && data.firstName !== "" && data.firstName !== guardia.firstName) {
                updateData.firstName = data.firstName;
            }
            if (data.lastName !== undefined && data.lastName !== "" && data.lastName !== guardia.lastName) {
                updateData.lastName = data.lastName;
            }
            if (data.tipoDocumento !== undefined && data.tipoDocumento !== guardia.tipoDocumento) {
                updateData.tipoDocumento = data.tipoDocumento;
            }
            if (data.numeroDocumento !== undefined && data.numeroDocumento !== "" && data.numeroDocumento !== guardia.numeroDocumento) {
                updateData.numeroDocumento = data.numeroDocumento;
            }
            if (data.telefono !== undefined && data.telefono !== "" && data.telefono !== guardia.telefono) {
                updateData.telefono = data.telefono;
            }

            // Si no hay cambios, mostrar mensaje
            if (Object.keys(updateData).length === 0) {
                toast.error("No hay cambios para guardar", {
                    duration: 2000,
                });
                setLoading(false);
                return;
            }

            // Using the guards-specific endpoint for updates
            await axiosInstance.put(`/condominios/guardias-seguridad/${guardia.id}`, updateData);

            toast.success("Guardia actualizado exitosamente", {
                duration: 2000,
            });

            await queryClient.invalidateQueries({ queryKey: ["guardias"] });

            onOpenChange(false);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Error al actualizar el guardia";

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

    if (!guardia) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Guardia de Seguridad</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del guardia {guardia.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Primer Nombre</FieldLabel>
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
                                <FieldLabel>Apellido</FieldLabel>
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
                            <FieldLabel>Nombre Completo</FieldLabel>
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
                                <FieldLabel>Email</FieldLabel>
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
                                <FieldLabel>Nueva Contraseña (opcional)</FieldLabel>
                                <Input
                                    type="password"
                                    {...register("password")}
                                    placeholder="Dejar vacío para no cambiar"
                                    disabled={loading}
                                />
                                {errors.password && (
                                    <FieldError>{errors.password.message}</FieldError>
                                )}
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Tipo de Documento</FieldLabel>
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
                                <FieldLabel>Número de Documento</FieldLabel>
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
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
