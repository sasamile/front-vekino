"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { ResumenPagos } from "@/components/dashboard/user/pagos/resumen-pagos";
import { ProximoPago } from "@/components/dashboard/user/pagos/proximo-pago";
import { ListaFacturas } from "@/components/dashboard/user/pagos/lista-facturas";
import { DialogPago } from "@/components/dashboard/user/pagos/dialog-pago";
import {
  formatCurrency,
  formatDate,
  puedePagar,
} from "@/components/dashboard/user/pagos/utils";
import { BadgeEstado } from "@/components/dashboard/user/pagos/badge-estado";
import type { Factura, CreatePagoRequest } from "@/types/types";
import type { MisPagosResponse } from "@/components/dashboard/user/pagos/types";

function PagosPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const AVAL_URL = process.env.NEXT_PUBLIC_AVAL_URL;
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<Factura | null>(null);
  const [pagoCreado, setPagoCreado] = useState<any>(null);

  // Obtener mis pagos (resumen y facturas)
  const { data: misPagos, isLoading: misPagosLoading } =
    useQuery<MisPagosResponse>({
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
    ? misPagos.resumen.vencidas.cantidad === 0 &&
      misPagos.resumen.pendientes.cantidad === 0
    : false;

  // Obtener próximo pago del resumen
  const proximoPago = misPagos?.resumen?.proximoVencimiento
    ? misPagos.facturas.find(
        (f) =>
          f.numeroFactura === misPagos.resumen.proximoVencimiento?.numeroFactura
      ) || null
    : null;

  // Calcular próximo período de pago si ya pagó todas las facturas
  const calcularProximoPeriodo = () => {
    if (!misPagos || misPagos.facturas.length === 0) return null;

    const facturasOrdenadas = [...misPagos.facturas].sort((a, b) => {
      const periodoA = a.periodo || "";
      const periodoB = b.periodo || "";
      return periodoB.localeCompare(periodoA);
    });

    const ultimaFactura = facturasOrdenadas[0];
    if (!ultimaFactura || !ultimaFactura.periodo) return null;

    const [year, month] = ultimaFactura.periodo.split("-").map(Number);
    const proximaFecha = new Date(year, month, 1);
    const proximoPeriodo = `${proximaFecha.getFullYear()}-${String(
      proximaFecha.getMonth() + 1
    ).padStart(2, "0")}`;

    return {
      periodo: proximoPeriodo,
      fecha: proximaFecha,
      periodoFormateado: proximaFecha.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      }),
    };
  };

  const proximoPeriodoInfo = calcularProximoPeriodo();

  // Mutación para crear pago
  const crearPagoMutation = useMutation({
    mutationFn: async (data: CreatePagoRequest & { redirectUrl: string }) => {
      const axiosInstance = getAxiosInstance(subdomain);
      const { redirectUrl, ...pagoData } = data;
      const endpoint =
        pagoData.metodoPago === "WOMPI"
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
    if (AVAL_URL) {
      window.open(AVAL_URL, "_blank");
      return;
    }
    let redirectUrl = `${window.location.origin}/pago-exitoso`;
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("localhost") &&
      subdomain
    ) {
      const port = window.location.port ? `:${window.location.port}` : "";
      redirectUrl = `${window.location.protocol}//${subdomain}.localhost${port}/pago-exitoso`;
    }

    await crearPagoMutation.mutateAsync({
      facturaId: factura.id,
      metodoPago: "WOMPI",
      observaciones: "",
      redirectUrl,
    });
  };

  const onSubmitPago = async (data: { metodoPago: string; observaciones?: string }) => {
    if (!facturaSeleccionada) return;

    if (AVAL_URL && data.metodoPago === "WOMPI") {
      window.open(AVAL_URL, "_blank");
      setPagoDialogOpen(false);
      return;
    }
    let redirectUrl = `${window.location.origin}/pago-exitoso`;
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("localhost") &&
      subdomain
    ) {
      const port = window.location.port ? `:${window.location.port}` : "";
      redirectUrl = `${window.location.protocol}//${subdomain}.localhost${port}/pago-exitoso`;
    }

    await crearPagoMutation.mutateAsync({
      facturaId: facturaSeleccionada.id,
      metodoPago: data.metodoPago as "WOMPI" | "EFECTIVO",
      observaciones: data.observaciones,
      redirectUrl,
    });
  };


  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Pagos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona tus facturas y pagos de administración
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <ResumenPagos
            misPagos={misPagos}
            isLoading={misPagosLoading}
            formatCurrency={formatCurrency}
          />
          <ProximoPago
            proximoPago={proximoPago}
            proximoPeriodoInfo={proximoPeriodoInfo}
            estaAlDia={estaAlDia}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            puedePagar={puedePagar}
            handlePagar={handlePagar}
            isPaying={crearPagoMutation.isPending}
          />
        </div>

        {/* Lista de Facturas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Facturas</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {misPagos
                  ? `${misPagos.total} factura${
                      misPagos.total !== 1 ? "s" : ""
                    } en total`
                  : "Cargando..."}
              </p>
            </div>
          </div>
          
          <ListaFacturas
            facturas={misPagos?.facturas || []}
            total={misPagos?.total || 0}
            isLoading={misPagosLoading}
            page={page}
            limit={limit}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            puedePagar={puedePagar}
            handlePagar={handlePagar}
            isPaying={crearPagoMutation.isPending}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Dialog de Pago */}
      <DialogPago
        open={pagoDialogOpen}
        onOpenChange={setPagoDialogOpen}
        factura={facturaSeleccionada}
        pagoCreado={pagoCreado}
        formatCurrency={formatCurrency}
        onSubmit={onSubmitPago}
        isPending={crearPagoMutation.isPending}
      />
    </div>
  );
}

export default PagosPage;
