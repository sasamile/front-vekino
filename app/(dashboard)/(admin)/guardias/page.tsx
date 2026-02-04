"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Residente } from "@/types/types";
import { GuardiasTable } from "@/components/dashboard/admin/guardias/guardias-table";
import { CreateGuardiaDialog } from "@/components/dashboard/admin/guardias/create-guardia-dialog";
import { EditGuardiaDialog } from "@/components/dashboard/admin/guardias/edit-guardia-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconCirclePlusFilled, IconSearch, IconFilter } from "@tabler/icons-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper interface for the response, assuming backend returns { data: [], total: ..., etc } for pagination
interface GuardiasResponse {
    data: Residente[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface GuardiasFilters {
    page: number;
    limit: number;
    search?: string;
    active?: boolean;
}

function GuardiasPage() {
    const { subdomain } = useSubdomain();
    const queryClient = useQueryClient();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedGuardia, setSelectedGuardia] = useState<Residente | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [filters, setFilters] = useState<GuardiasFilters>({
        page: 1,
        limit: 10,
        search: "",
    });
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText, 500);

    // Prevenir errores de hidratación renderizando solo en el cliente
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Actualizar filtros cuando cambia el debounce
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            search: debouncedSearchText.trim() || undefined,
            page: 1,
        }));
    }, [debouncedSearchText]);

    // Construir query params para el endpoint
    const queryParams = new URLSearchParams();
    queryParams.append("page", filters.page.toString());
    queryParams.append("limit", filters.limit.toString());
    if (filters.search) {
        queryParams.append("search", filters.search);
    }
    if (filters.active !== undefined) {
        queryParams.append("active", String(filters.active));
    }

    // Note: The backend endpoint is /condominios/guardias-seguridad
    const endpoint = `/condominios/guardias-seguridad?${queryParams.toString()}`;

    // Obtener guardias
    const {
        data: guardiasPayload,
        isLoading,
        error,
    } = useQuery<GuardiasResponse>({
        queryKey: ["guardias", filters.page, filters.limit, filters.search, filters.active],
        queryFn: async () => {
            const axiosInstance = getAxiosInstance(subdomain);
            const response = await axiosInstance.get(endpoint);
            return response.data;
        },
        retry: false, // No reintentar automáticamente en caso de error
    });

    // Manejar errores (React Query v5 no tiene onError)
    useEffect(() => {
        if (error) {
            const axiosError = error as any;
            // Mostrar error específico para 403
            if (axiosError?.response?.status === 403) {
                toast.error("No tienes permisos para acceder a esta sección", {
                    duration: 4000,
                });
            } else {
                toast.error(
                    axiosError?.response?.data?.message ||
                    axiosError?.message ||
                    "Error al cargar los guardias",
                    {
                        duration: 4000,
                    }
                );
            }
        }
    }, [error]);

    const guardias = guardiasPayload?.data || [];
    const total = guardiasPayload?.total || 0;
    const totalPages = guardiasPayload?.totalPages || 0;

    // Mutación para eliminar guardia
    const deleteMutation = useMutation({
        mutationFn: async (guardiaId: string) => {
            const axiosInstance = getAxiosInstance(subdomain);
            await axiosInstance.delete(`/condominios/guardias-seguridad/${guardiaId}`);
        },
        onSuccess: () => {
            toast.success("Guardia eliminado exitosamente", {
                duration: 2000,
            });
            queryClient.invalidateQueries({ queryKey: ["guardias"] });
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Error al eliminar el guardia";
            toast.error(errorMessage, {
                duration: 3000,
            });
        },
    });

    const handleEdit = (guardia: Residente) => {
        setSelectedGuardia(guardia);
        setEditDialogOpen(true);
    };

    const handleDelete = (guardia: Residente) => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar al guardia "${guardia.name}"?`,
            )
        ) {
            deleteMutation.mutate(guardia.id);
        }
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit: number) => {
        setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const handleEstadoFilter = (active: boolean | null) => {
        setFilters((prev) => ({
            ...prev,
            active: active !== null ? active : undefined,
            page: 1,
        }));
    };

    const clearFilters = () => {
        setFilters({ page: 1, limit: 10 });
        setSearchText("");
    };

    // Contar filtros activos
    const activeFiltersCount = [
        filters.search,
        filters.active !== undefined,
    ].filter(Boolean).length;

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-y-2">
                <div>
                    <h1 className="text-3xl font-bold">Guardias de Seguridad</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestiona el equipo de seguridad del condominio
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="gap-2 flex-1 sm:flex-none"
                    >
                        <IconCirclePlusFilled className="size-4" />
                        Crear Guardia
                    </Button>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre, email o documento..."
                        className="pl-8"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {isMounted ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <IconFilter className="size-4" />
                                    Estado
                                    {filters.active !== undefined && (
                                        <span className="ml-1 rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-xs">
                                            {filters.active ? "✓" : "✗"}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEstadoFilter(null)}>
                                    Todos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEstadoFilter(true)}>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500" />
                                        Activos
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEstadoFilter(false)}>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-red-500" />
                                        Inactivos
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="outline" className="gap-2" suppressHydrationWarning>
                            <IconFilter className="size-4" />
                            Estado
                        </Button>
                    )}

                    {activeFiltersCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="gap-2"
                        >
                            Limpiar filtros ({activeFiltersCount})
                        </Button>
                    )}
                </div>
            </div>

            <GuardiasTable
                guardias={guardias}
                isLoading={isLoading}
                error={error as Error}
                onEdit={handleEdit}
                onDelete={handleDelete}
                total={total}
                currentPage={filters.page}
                totalPages={totalPages}
                limit={filters.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
            />

            <CreateGuardiaDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />

            <EditGuardiaDialog
                open={editDialogOpen}
                onOpenChange={(open: boolean) => {
                    setEditDialogOpen(open);
                    if (!open) {
                        setSelectedGuardia(null);
                    }
                }}
                guardia={selectedGuardia}
            />
        </div>
    );
}

export default GuardiasPage;
