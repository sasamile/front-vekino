"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Button } from "@/components/ui/button";
import { IconCheck, IconX, IconClock, IconAlertCircle } from "@tabler/icons-react";

interface PagoEstado {
  id: string;
  facturaId: string;
  valor: number;
  metodoPago: string;
  estado: "PENDIENTE" | "PROCESANDO" | "APROBADO" | "RECHAZADO" | "CANCELADO";
  fechaPago: string | null;
  wompiTransactionId?: string;
  wompiReference?: string;
  actualizado?: boolean;
  wompiStatus?: {
    id: string;
    status: string;
    amount_in_cents: number;
    reference: string;
    created_at: string;
    finalized_at?: string;
  };
  factura?: {
    id: string;
    numeroFactura: string;
    valor: number;
    estado: string;
  };
}

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { subdomain } = useSubdomain();
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Obtener el ID de la transacción de Wompi desde la URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setTransactionId(id);
    }
  }, [searchParams]);

  // Verificar y actualizar el estado del pago usando el transaction ID de Wompi
  const { data: pago, isLoading, error } = useQuery<PagoEstado>({
    queryKey: ["pago-wompi", transactionId],
    queryFn: async () => {
      if (!transactionId) return null;
      
      const axiosInstance = getAxiosInstance(subdomain);
      
      try {
        // Usar el endpoint de verificación que actualiza automáticamente el estado
        const response = await axiosInstance.get(`/finanzas/pagos/verificar/${transactionId}`);
        return response.data;
      } catch (err: any) {
        // Si hay error de autenticación, mostrar mensaje apropiado
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          throw new Error("Debes iniciar sesión para verificar el estado del pago");
        }
        
        // Si el endpoint no existe (404), intentar buscar manualmente como fallback
        if (err?.response?.status === 404) {
          try {
            // Buscar en las facturas del usuario
            const misPagosResponse = await axiosInstance.get("/finanzas/mis-pagos", {
              params: {
                limit: 100,
                page: 1,
              },
            });
            
            const facturas = misPagosResponse.data?.facturas || [];
            
            // Buscar pagos asociados a las facturas
            for (const factura of facturas) {
              if (factura.pagos && Array.isArray(factura.pagos)) {
                const pagoEncontrado = factura.pagos.find((p: any) => 
                  p.wompiTransactionId === transactionId || 
                  p.wompiReference?.includes(transactionId)
                );
                
                if (pagoEncontrado && pagoEncontrado.id) {
                  // Obtener el estado completo del pago
                  const estadoResponse = await axiosInstance.get(`/finanzas/pagos/${pagoEncontrado.id}/estado`);
                  return estadoResponse.data;
                }
              }
            }
          } catch (searchErr: any) {
            console.error("Error al buscar pago manualmente:", searchErr);
          }
        }
        
        console.error("Error al verificar pago:", err);
        throw err;
      }
    },
    enabled: !!transactionId,
    retry: 1,
    retryDelay: 2000,
    refetchInterval: (query) => {
      // Si el pago está procesando, hacer polling cada 5 segundos para verificar actualización
      const pago = query.state.data;
      return pago?.estado === "PROCESANDO" ? 5000 : false;
    },
  });


  const getEstadoInfo = () => {
    if (!pago) return null;

    switch (pago.estado) {
      case "APROBADO":
        return {
          icon: IconCheck,
          title: "¡Pago exitoso!",
          message: "Tu pago ha sido procesado correctamente.",
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
          borderColor: "border-emerald-200 dark:border-emerald-800",
        };
      case "PROCESANDO":
        return {
          icon: IconClock,
          title: "Procesando pago",
          message: "Tu pago está siendo procesado. Por favor espera unos momentos...",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      case "RECHAZADO":
        return {
          icon: IconX,
          title: "Pago rechazado",
          message: "Tu pago fue rechazado. Por favor intenta nuevamente.",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
        };
      case "CANCELADO":
        return {
          icon: IconX,
          title: "Pago cancelado",
          message: "El pago fue cancelado.",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/20",
          borderColor: "border-amber-200 dark:border-amber-800",
        };
      default:
        return {
          icon: IconAlertCircle,
          title: "Estado desconocido",
          message: "No se pudo determinar el estado del pago.",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
        };
    }
  };

  const estadoInfo = getEstadoInfo();
  const Icon = estadoInfo?.icon || IconAlertCircle;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // No mostrar nada hasta que cargue completamente
  if (isLoading) {
    return null;
  }



  // Mostrar el resultado del pago solo cuando esté cargado
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-emerald-950/20 p-4">
      <div className="max-w-lg w-full">
        <div className={`p-10 rounded-2xl border-2 shadow-2xl backdrop-blur-sm ${
          pago?.estado === "APROBADO"
            ? "border-emerald-300 dark:border-emerald-700 bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-800"
            : pago?.estado === "PROCESANDO"
            ? "border-blue-300 dark:border-blue-700 bg-linear-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-800"
            : pago?.estado === "RECHAZADO"
            ? "border-red-300 dark:border-red-700 bg-linear-to-br from-red-50 to-white dark:from-red-950/40 dark:to-gray-800"
            : "border-amber-300 dark:border-amber-700 bg-linear-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-800"
        }`}>
          <div className="text-center space-y-8">
            {/* Icono principal */}
            <div className="flex justify-center">
              <div className={`p-6 rounded-full shadow-lg ${
                pago?.estado === "APROBADO"
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : pago?.estado === "PROCESANDO"
                  ? "bg-blue-100 dark:bg-blue-900/50"
                  : pago?.estado === "RECHAZADO"
                  ? "bg-red-100 dark:bg-red-900/50"
                  : "bg-amber-100 dark:bg-amber-900/50"
              }`}>
                <Icon className={`size-16 ${estadoInfo?.color}`} />
              </div>
            </div>
            
            {/* Título y mensaje */}
            <div className="space-y-3">
              <h1 className={`text-3xl font-bold ${estadoInfo?.color}`}>
                {estadoInfo?.title}
              </h1>
              <p className="text-base text-gray-700 dark:text-gray-300">
                {estadoInfo?.message}
              </p>
            </div>

            {/* Información del pago */}
            {pago && (
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3 text-sm">
                  {pago.factura && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Factura:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{pago.factura.numeroFactura}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Valor:</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(pago.valor)}</span>
                  </div>
                  {pago.fechaPago && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Fecha de pago:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(pago.fechaPago)}</span>
                    </div>
                  )}
                  {pago.wompiTransactionId && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">ID Transacción:</span>
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{pago.wompiTransactionId}</span>
                    </div>
                  )}
                  {pago.actualizado && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                        <IconCheck className="size-4" />
                        Estado actualizado desde Wompi
                      </p>
                    </div>
                  )}
                  {pago.wompiStatus && (
                    <div className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        Estado en Wompi: <span className="font-semibold">{pago.wompiStatus.status}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-6">
              <Button
                onClick={() => router.push("/pagos")}
                variant="outline"
                className="flex-1 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                size="lg"
              >
                Ver Mis Pagos
              </Button>
              {pago?.estado === "APROBADO" && (
                <Button
                  onClick={() => router.push("/")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  size="lg"
                >
                  Ir al Inicio
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PagoExitosoPage() {
  return (
    <Suspense fallback={null}>
      <PagoExitosoContent />
    </Suspense>
  );
}

export default PagoExitosoPage;

