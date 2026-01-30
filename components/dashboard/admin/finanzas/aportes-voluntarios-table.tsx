import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconTrash } from "@tabler/icons-react";
import { AporteVoluntario } from "@/types/types";

interface AportesVoluntariosTableProps {
    aportes: AporteVoluntario[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    isAdmin: boolean;
    // Pagination props
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

export function AportesVoluntariosTable({
    aportes,
    isLoading,
    onDelete,
    isAdmin,
    total,
    currentPage,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
}: AportesVoluntariosTableProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="rounded-md border p-0 overflow-x-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Unidad</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nombre</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descripción</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle"><Skeleton className="h-4 w-24" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-4 w-16" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-4 w-32" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-4 w-48" /></td>
                                    <td className="p-4 align-middle flex justify-end"><Skeleton className="h-4 w-20" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-8 w-8 rounded-md" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border p-0 overflow-x-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Unidad</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nombre</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descripción</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {aportes.length === 0 ? (
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <td colSpan={6} className="p-4 align-middle text-center h-24 text-muted-foreground">
                                    No hay aportes voluntarios registrados
                                </td>
                            </tr>
                        ) : (
                            aportes.map((aporte) => (
                                <tr key={aporte.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        {new Date(aporte.createdAt).toLocaleDateString("es-CO")}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {aporte.unidad?.identificador || "N/A"}
                                    </td>
                                    <td className="p-4 align-middle">{aporte.nombre}</td>
                                    <td className="p-4 align-middle max-w-[300px] truncate" title={aporte.descripcion}>
                                        {aporte.descripcion}
                                    </td>
                                    <td className="p-4 align-middle text-right font-medium">
                                        {new Intl.NumberFormat("es-CO", {
                                            style: "currency",
                                            currency: "COP",
                                            maximumFractionDigits: 0,
                                        }).format(aporte.valor)}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <IconDotsVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => onDelete(aporte.id)}
                                                    >
                                                        <IconTrash className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Paginación simple reutilizable o custom */}
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Mostrando {aportes.length} de {total} resultados
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm font-medium">
                        Página {currentPage} de {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
