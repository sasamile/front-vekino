import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    unidadId: z.string().min(1, "La unidad es requerida"),
    valor: z.coerce.number().min(1, "El valor debe ser mayor a 0"),
    descripcion: z.string().min(1, "La descripción es requerida"),
});

interface CreateAporteVoluntarioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateAporteVoluntarioDialog({
    open,
    onOpenChange,
}: CreateAporteVoluntarioDialogProps) {
    const { subdomain } = useSubdomain();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nombre: "",
            unidadId: "",
            valor: 0,
            descripcion: "",
        },
    });

    // Obtener unidades
    const { data: unidades = [] } = useQuery({
        queryKey: ["unidades"],
        queryFn: async () => {
            const axiosInstance = getAxiosInstance(subdomain);
            const response = await axiosInstance.get("/unidades");
            const data = response.data;
            return Array.isArray(data) ? data : (data?.data || []);
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const axiosInstance = getAxiosInstance(subdomain);
            // Incluimos userId si existe en la selección de unidad (opcional, por ahora enviamos solo lo del form)
            // La API dice que userId es opcional en el request, pero el curl example lo mandaba. 
            // Supongamos que el backend lo infiere o lo toma del token si no se manda, 
            // o podemos mapear la unidad a un usuario si tenemos esa data.
            // Por simplicidad, mandamos lo que pide el form.
            await axiosInstance.post("/finanzas/aportes-voluntarios", values);
        },
        onSuccess: () => {
            toast.success("Aporte voluntario creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["aportes-voluntarios"] });
            onOpenChange(false);
            form.reset();
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Error al crear el aporte voluntario";
            toast.error(errorMessage);
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Aporte Voluntario</DialogTitle>
                    <DialogDescription>
                        Ingesa los detalles del aporte voluntario.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Aportante</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="unidadId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidad</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            onChange={field.onChange}
                                            value={field.value}
                                        >
                                            <option value="" disabled>Seleccione una unidad</option>
                                            {unidades.map((unidad: any) => (
                                                <option key={unidad.id} value={unidad.id}>
                                                    {unidad.identificador}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="valor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Arriendo de parqueadero"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
