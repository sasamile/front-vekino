"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  IconAlertCircle,
  IconCheck,
  IconSparkles,
  IconArrowRight,
  IconX,
} from "@tabler/icons-react";
import type { Factura, FacturaEstado, CreatePagoRequest } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const pagoSchema = z.object({
  metodoPago: z.enum(["WOMPI", "EFECTIVO"]),
  observaciones: z.string().optional(),
});

type PagoFormData = z.infer<typeof pagoSchema>;

interface ResumenPagos {
  pendientes: {
    cantidad: number;
    valor: number;
  };
  vencidas: {
    cantidad: number;
    valor: number;
  };
  pagadas: {
    cantidad: number;
    valor: number;
  };
  proximoVencimiento: {
    numeroFactura: string;
    fechaVencimiento: string;
    valor: number;
    estado: FacturaEstado;
  } | null;
}

interface MisPagosResponse {
  resumen: ResumenPagos;
  facturas: Factura[];
  total: number;
}

function PagosPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [pagoCreado, setPagoCreado] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      metodoPago: "WOMPI",
      observaciones: "",
    },
  });

  // Obtener mis pagos (resumen y facturas)
  const {
    data: misPagos,
    isLoading: misPagosLoading,
  } = useQuery<MisPagosResponse>({
    queryKey: ["mis-pagos", page, limit],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get(
        `/finanzas/mis-pagos?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

  // Calcular si está al día
  const estaAlDia = misPagos?.resumen
    ? misPagos.resumen.vencidas.cantidad === 0 && misPagos.resumen.pendientes.cantidad === 0
    : false;

  // Obtener próximo pago del resumen
  const proximoPago = misPagos?.resumen?.proximoVencimiento
    ? misPagos.facturas.find(
        (f) => f.numeroFactura === misPagos.resumen.proximoVencimiento?.numeroFactura
      ) || null
    : null;

  // Mutación para crear pago
  const crearPagoMutation = useMutation({
    mutationFn: async (data: CreatePagoRequest & { redirectUrl: string }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      const { redirectUrl, ...pagoData } = data;
      const endpoint = pagoData.metodoPago === "WOMPI"
        ? `/finanzas/pagos?redirectUrl=${encodeURIComponent(redirectUrl)}`
        : `/finanzas/pagos`;
      const response = await axiosInstance.post(endpoint, pagoData);
      return response.data;
    },
    onSuccess: (pago) => {
      const paymentLink = pago.paymentLink || pago.wompiPaymentLink;
      if (pago.metodoPago === "WOMPI" && paymentLink) {
        setPagoCreado({ ...pago, paymentLink });
        toast.success("Redirigiendo a Wompi para completar el pago...", {
          duration: 2000,
        });
        setTimeout(() => {
          window.location.href = paymentLink;
        }, 1500);
      } else {
        toast.success("Pago registrado exitosamente", { duration: 2000 });
        reset();
        setPagoDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["mis-pagos"] });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el pago";
      toast.error(errorMessage, { duration: 3000 });
    },
  });

  const handlePagar = async (factura: Factura) => {
    // Crear pago directamente con WOMPI sin mostrar modal
    let redirectUrl = `${window.location.origin}/pago-exitoso`;
    if (typeof window !== 'undefined' && window.location.hostname.includes('localhost') && subdomain) {
      const port = window.location.port ? `:${window.location.port}` : '';
      redirectUrl = `${window.location.protocol}//${subdomain}.localhost${port}/pago-exitoso`;
    }

    await crearPagoMutation.mutateAsync({
      facturaId: factura.id,
      metodoPago: "WOMPI",
      observaciones: "",
      redirectUrl,
    });
  };

  const onSubmitPago = async (data: PagoFormData) => {
    if (!facturaSeleccionada) return;

    let redirectUrl = `${window.location.origin}/pago-exitoso`;
    if (typeof window !== 'undefined' && window.location.hostname.includes('localhost') && subdomain) {
      const port = window.location.port ? `:${window.location.port}` : '';
      redirectUrl = `${window.location.protocol}//${subdomain}.localhost${port}/pago-exitoso`;
    }

    await crearPagoMutation.mutateAsync({
      facturaId: facturaSeleccionada.id,
      metodoPago: data.metodoPago,
      observaciones: data.observaciones,
      redirectUrl,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getEstadoBadge = (estado: FacturaEstado) => {
    const variants: Record<
      FacturaEstado,
      { variant: "default" | "destructive" | "secondary"; label: string }
    > = {
      PAGADA: { variant: "default", label: "Pagada" },
      PENDIENTE: { variant: "secondary", label: "Pendiente" },
      ENVIADA: { variant: "secondary", label: "Enviada" },
      VENCIDA: { variant: "destructive", label: "Vencida" },
      CANCELADA: { variant: "secondary", label: "Cancelada" },
    };
    const config = variants[estado] || {
      variant: "secondary" as const,
      label: estado,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const puedePagar = (factura: Factura) => {
    if ('puedePagar' in factura && typeof factura.puedePagar === 'boolean') {
      return factura.puedePagar;
    }
    return factura.estado === "PENDIENTE" || factura.estado === "VENCIDA" || factura.estado === "ENVIADA";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas y pagos de administración
          </p>
        </div>

        {/* Resumen */}
        {misPagosLoading ? (
          <div className="space-y-6 mb-10">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        ) : misPagos ? (
          <div className="space-y-6 mb-10">
            {/* Estado con Semáforo */}
            <div className={`p-6 rounded-lg border-2 ${
              estaAlDia 
                ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20" 
                : misPagos.resumen.vencidas.cantidad > 0
                ? "border-red-500/30 bg-red-50 dark:bg-red-950/20"
                : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
            }`}>
              <div className="flex items-center gap-4">
                {/* Semáforo */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Verde - Al día */}
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    estaAlDia 
                      ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 dark:ring-emerald-600" 
                      : "bg-gray-300 dark:bg-gray-600 opacity-40"
                  }`} />
                  {/* Amarillo - Pendientes */}
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    !estaAlDia && misPagos.resumen.vencidas.cantidad === 0
                      ? "bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300 dark:ring-amber-600" 
                      : "bg-gray-300 dark:bg-gray-600 opacity-40"
                  }`} />
                  {/* Rojo - Vencidas */}
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    misPagos.resumen.vencidas.cantidad > 0
                      ? "bg-red-500 shadow-lg shadow-red-500/50 ring-2 ring-red-300 dark:ring-red-600" 
                      : "bg-gray-300 dark:bg-gray-600 opacity-40"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-xl mb-1 ${
                    estaAlDia 
                      ? "text-emerald-700 dark:text-emerald-300" 
                      : misPagos.resumen.vencidas.cantidad > 0
                      ? "text-red-700 dark:text-red-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}>
                    {estaAlDia 
                      ? "Estás al día" 
                      : misPagos.resumen.vencidas.cantidad > 0
                      ? "Tienes facturas vencidas"
                      : "Tienes facturas pendientes"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {misPagos.resumen.vencidas.cantidad > 0 
                      ? `${misPagos.resumen.vencidas.cantidad} factura${misPagos.resumen.vencidas.cantidad > 1 ? 's' : ''} vencida${misPagos.resumen.vencidas.cantidad > 1 ? 's' : ''} por un total de ${formatCurrency(misPagos.resumen.vencidas.valor)}`
                      : misPagos.resumen.pendientes.cantidad > 0
                      ? `${misPagos.resumen.pendientes.cantidad} factura${misPagos.resumen.pendientes.cantidad > 1 ? 's' : ''} pendiente${misPagos.resumen.pendientes.cantidad > 1 ? 's' : ''} por un total de ${formatCurrency(misPagos.resumen.pendientes.valor)}`
                      : "Todas tus facturas están pagadas"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-3">
                  Pendientes
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                  {misPagos.resumen.pendientes.cantidad}
                </p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(misPagos.resumen.pendientes.valor)}
                </p>
              </div>
              <div className="p-5 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-950/10">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-3">
                  Vencidas
                </p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300 mb-1">
                  {misPagos.resumen.vencidas.cantidad}
                </p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(misPagos.resumen.vencidas.valor)}
                </p>
              </div>
              <div className="p-5 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-3">
                  Pagadas
                </p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  {misPagos.resumen.pagadas.cantidad}
                </p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {misPagos.resumen.pagadas.cantidad > 0 ? "Completadas" : "Sin pagos"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Próximo Pago */}
        {proximoPago && (
          <div className="mb-10 p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold">{proximoPago.numeroFactura}</span>
                  {getEstadoBadge(proximoPago.estado)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {proximoPago.descripcion || `Cuota de administración ${proximoPago.periodo}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vence el {formatDate(proximoPago.fechaVencimiento)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold mb-3">{formatCurrency(proximoPago.valor)}</p>
                {puedePagar(proximoPago) && (
                  <Button 
                    onClick={() => handlePagar(proximoPago)}
                    disabled={crearPagoMutation.isPending}
                  >
                    {crearPagoMutation.isPending ? (
                      "Procesando..."
                    ) : (
                      <>
                        Pagar ahora
                        <IconArrowRight className="size-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Facturas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Facturas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {misPagos ? `${misPagos.total} factura${misPagos.total !== 1 ? 's' : ''} en total` : "Cargando..."}
              </p>
            </div>
          </div>
          
          {misPagosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : misPagos && misPagos.facturas.length > 0 ? (
            <>
              <div className="space-y-3">
                {misPagos.facturas.map((factura) => {
                  const isPagada = factura.estado === "PAGADA";
                  const isVencida = factura.estado === "VENCIDA";
                  const isPendiente = factura.estado === "PENDIENTE" || factura.estado === "ENVIADA";
                  
                  return (
                    <div
                      key={factura.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isPagada
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                          : isVencida
                          ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                          : "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-base">{factura.numeroFactura}</span>
                          {getEstadoBadge(factura.estado)}
                          {isPagada && (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <IconCheck className="size-4" />
                              <span className="text-xs font-medium">Pagada</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {factura.descripcion || `Cuota de administración ${factura.periodo}`}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`font-medium ${
                            isVencida 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-muted-foreground"
                          }`}>
                            Vence: {formatDate(factura.fechaVencimiento)}
                          </span>
                          {factura.fechaPago && (
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <IconCheck className="size-3" />
                              Pagado: {formatDate(factura.fechaPago)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-lg font-bold ${
                          isPagada
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-foreground"
                        }`}>
                          {formatCurrency(factura.valor)}
                        </span>
                        {puedePagar(factura) && (
                          <Button
                            onClick={() => handlePagar(factura)}
                            size="sm"
                            variant={isVencida ? "default" : "outline"}
                            className={isVencida ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                            disabled={crearPagoMutation.isPending}
                          >
                            {crearPagoMutation.isPending ? "Procesando..." : "Pagar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {misPagos.facturas.length >= limit && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} • {misPagos.facturas.length} de {misPagos.total}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={misPagos.facturas.length < limit}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">No hay facturas disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Realizar Pago</DialogTitle>
            <DialogDescription>
              {facturaSeleccionada && `Pagar la factura ${facturaSeleccionada.numeroFactura}`}
            </DialogDescription>
          </DialogHeader>

          {pagoCreado && pagoCreado.paymentLink ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Redirigiendo a Wompi para completar el pago...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Si no eres redirigido automáticamente, haz clic en el botón de abajo.
                </p>
              </div>
              <Button
                onClick={() => {
                  const link = pagoCreado.paymentLink || pagoCreado.wompiPaymentLink;
                  if (link) {
                    window.location.href = link;
                  }
                }}
                className="w-full"
                size="lg"
              >
                Ir a Wompi para Pagar
                <IconArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          ) : facturaSeleccionada ? (
            <form onSubmit={handleSubmit(onSubmitPago)} className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Factura:</span>
                  <span className="text-sm font-semibold">{facturaSeleccionada.numeroFactura}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Valor a pagar:</span>
                  <span className="text-xl font-bold">{formatCurrency(facturaSeleccionada.valor)}</span>
                </div>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel>Método de Pago *</FieldLabel>
                  <select
                    {...register("metodoPago")}
                    disabled={crearPagoMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="WOMPI">Wompi (Tarjeta, PSE, etc.) - Procesamiento automático</option>
                    <option value="EFECTIVO">Efectivo - Se marca como completado automáticamente</option>
                  </select>
                  {errors.metodoPago && (
                    <FieldError>{errors.metodoPago.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Observaciones (opcional)</FieldLabel>
                  <textarea
                    {...register("observaciones")}
                    placeholder="Observaciones adicionales del pago..."
                    disabled={crearPagoMutation.isPending}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </Field>
              </FieldGroup>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setPagoDialogOpen(false);
                    setPagoCreado(null);
                  }}
                  disabled={crearPagoMutation.isPending}
                >
                  <IconX className="size-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearPagoMutation.isPending} size="lg">
                  {crearPagoMutation.isPending ? (
                    "Procesando..."
                  ) : (
                    <>
                      <IconSparkles className="size-4 mr-2" />
                      Proceder al Pago
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PagosPage;
