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
  IconDownload,
  IconFileText,
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
  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<Factura | null>(null);
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

    // Encontrar la factura más reciente (por período)
    const facturasOrdenadas = [...misPagos.facturas].sort((a, b) => {
      const periodoA = a.periodo || "";
      const periodoB = b.periodo || "";
      return periodoB.localeCompare(periodoA);
    });

    const ultimaFactura = facturasOrdenadas[0];
    if (!ultimaFactura || !ultimaFactura.periodo) return null;

    // Calcular el próximo mes
    const [year, month] = ultimaFactura.periodo.split("-").map(Number);
    const proximaFecha = new Date(year, month, 1); // Primer día del próximo mes
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

  const onSubmitPago = async (data: PagoFormData) => {
    if (!facturaSeleccionada) return;

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
    if ("puedePagar" in factura && typeof factura.puedePagar === "boolean") {
      return factura.puedePagar;
    }
    return (
      factura.estado === "PENDIENTE" ||
      factura.estado === "VENCIDA" ||
      factura.estado === "ENVIADA"
    );
  };

  // Obtener información del usuario y unidad para el comprobante
  const { data: usuarioInfo } = useQuery({
    queryKey: ["usuario-info"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/condominios/me");
      return response.data;
    },
  });

  const unidadId = usuarioInfo?.user?.unidadId || usuarioInfo?.unidadId;
  const { data: unidadInfo } = useQuery({
    queryKey: ["unidad-info", unidadId],
    queryFn: async () => {
      if (!unidadId) return null;
      const axiosInstance = getAxiosInstance(subdomain);
      try {
        const response = await axiosInstance.get(
          `/unidades/public/${unidadId}`
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!unidadId,
  });

  const handleVerComprobante = async (factura: Factura) => {
    // Mostrar toast de carga
    toast.loading("Generando comprobante PDF...", { id: "generating-pdf" });

    // Obtener información del condominio desde diferentes posibles ubicaciones
    const condominioData =
      usuarioInfo?.condominio || usuarioInfo?.condominioInfo || {};
    const condominioNombre =
      condominioData.nombre ||
      usuarioInfo?.condominioName ||
      subdomain ||
      "Condominio";
    const condominioLogo = condominioData.logo || usuarioInfo?.logo || null;
    const condominioDireccion =
      condominioData.direccion || condominioData.address || "";
    const condominioTelefono =
      condominioData.telefono || condominioData.phone || "";
    const condominioNit = condominioData.nit || condominioData.nitNumber || "";

    const periodoFormateado = factura.periodo
      ? (() => {
          try {
            const [year, month] = factura.periodo.split("-").map(Number);
            const fecha = new Date(year, month - 1, 1);
            return fecha.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            });
          } catch {
            return factura.periodo;
          }
        })()
      : factura.periodo || "N/A";

    const usuarioNombre =
      factura.user?.name ||
      usuarioInfo?.user?.name ||
      usuarioInfo?.name ||
      "N/A";
    const unidadIdentificador =
      factura.unidad?.identificador || unidadInfo?.identificador || "N/A";

    // Verificar si fue pagado con mora
    const fuePagadoConMora =
      factura.fechaPago && factura.fechaVencimiento
        ? new Date(factura.fechaPago) > new Date(factura.fechaVencimiento)
        : false;

    // Generar código único para el comprobante (basado en ID y fecha)
    const codigoComprobante = `${factura.id
      .slice(0, 8)
      .toUpperCase()}-${new Date().getTime().toString(36).toUpperCase()}`;

    // Crear el HTML del comprobante como string
    const escapeHtml = (text: string) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    const htmlContent =
      '<div style="font-family: Georgia, serif; color: #1a1a1a; background: #ffffff; padding: 40px 50px; max-width: 800px; margin: 0 auto; position: relative;">' +
      '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: bold; color: rgba(0, 0, 0, 0.03); z-index: 0; pointer-events: none; white-space: nowrap; letter-spacing: 20px;">' +
      escapeHtml(condominioNombre.toUpperCase()) +
      "</div>" +
      '<div style="position: relative; z-index: 1;">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #1a1a1a;">' +
      '<div style="flex: 1;">' +
      '<div style="width: 120px; height: 120px; border: 2px solid #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: white; overflow: hidden; margin-bottom: 15px;">' +
      (condominioLogo
        ? '<img src="' +
          escapeHtml(condominioLogo) +
          '" alt="' +
          escapeHtml(condominioNombre) +
          '" style="max-width: 100%; max-height: 100%; object-fit: contain;">'
        : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #666;">🏢</div>') +
      "</div>" +
      '<div style="font-size: 32px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a;">' +
      escapeHtml(condominioNombre) +
      "</div>" +
      '<div style="font-size: 12px; color: #666; line-height: 1.6;">' +
      (condominioDireccion
        ? "<div>" + escapeHtml(condominioDireccion) + "</div>"
        : "") +
      (condominioTelefono
        ? "<div>Tel: " + escapeHtml(condominioTelefono) + "</div>"
        : "") +
      (condominioNit
        ? "<div>NIT: " + escapeHtml(condominioNit) + "</div>"
        : "") +
      "</div>" +
      "</div>" +
      '<div style="text-align: right; flex: 1;">' +
      '<div style="font-size: 36px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 3px;">Comprobante</div>' +
      '<div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">de Pago</div>' +
      '<div style="background: #1a1a1a; color: white; padding: 15px 25px; display: inline-block; font-size: 18px; font-weight: bold; margin-top: 15px; letter-spacing: 2px;">' +
      escapeHtml(factura.numeroFactura) +
      "</div>" +
      (fuePagadoConMora
        ? '<div style="background: #dc2626; color: white; padding: 8px 16px; display: inline-block; font-size: 12px; font-weight: bold; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">⚠ PAGADO CON MORA</div>'
        : "") +
      "</div>" +
      "</div>" +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 40px 0;">' +
      '<div style="border: 1px solid #e5e5e5; padding: 20px; background: #fafafa;">' +
      '<div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 15px; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Información del Cliente</div>' +
      '<div style="margin-bottom: 12px; font-size: 14px;"><div style="font-weight: 600; color: #333; margin-bottom: 3px;">Unidad:</div><div style="color: #1a1a1a; font-size: 15px;">' +
      escapeHtml(unidadIdentificador) +
      "</div></div>" +
      '<div style="margin-bottom: 12px; font-size: 14px;"><div style="font-weight: 600; color: #333; margin-bottom: 3px;">Propietario/Residente:</div><div style="color: #1a1a1a; font-size: 15px;">' +
      escapeHtml(usuarioNombre) +
      "</div></div>" +
      "</div>" +
      '<div style="border: 1px solid #e5e5e5; padding: 20px; background: #fafafa;">' +
      '<div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 15px; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Información del Pago</div>' +
      '<div style="margin-bottom: 12px; font-size: 14px;"><div style="font-weight: 600; color: #333; margin-bottom: 3px;">Fecha de Emisión:</div><div style="color: #1a1a1a; font-size: 15px;">' +
      escapeHtml(formatDate(factura.fechaEmision)) +
      "</div></div>" +
      '<div style="margin-bottom: 12px; font-size: 14px;"><div style="font-weight: 600; color: #333; margin-bottom: 3px;">Fecha de Pago:</div><div style="color: #1a1a1a; font-size: 15px;">' +
      escapeHtml(factura.fechaPago ? formatDate(factura.fechaPago) : "N/A") +
      "</div></div>" +
      '<div style="margin-bottom: 12px; font-size: 14px;"><div style="font-weight: 600; color: #333; margin-bottom: 3px;">Período:</div><div style="color: #1a1a1a; font-size: 15px;">' +
      escapeHtml(periodoFormateado) +
      "</div></div>" +
      "</div>" +
      "</div>" +
      '<table style="width: 100%; margin: 40px 0; border-collapse: collapse;"><thead><tr style="background: #1a1a1a; color: white;"><th style="padding: 15px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Descripción</th><th style="padding: 15px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Valor</th></tr></thead><tbody><tr><td style="padding: 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px;">' +
      escapeHtml(
        factura.descripcion || `Cuota de administración ${periodoFormateado}`
      ) +
      '</td><td style="padding: 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px; text-align: right; font-weight: bold;">' +
      escapeHtml(formatCurrency(factura.valor)) +
      "</td></tr></tbody></table>" +
      '<div style="margin-top: 30px; padding-top: 20px; border-top: 3px solid #1a1a1a;"><div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px;"><span>Subtotal:</span><span>' +
      escapeHtml(formatCurrency(factura.valor)) +
      "</span></div>" +
      (fuePagadoConMora
        ? '<div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; color: #dc2626;"><span>Recargo por Mora:</span><span>Incluido</span></div>'
        : "") +
      '<div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 24px; font-weight: bold; margin-top: 10px; padding-top: 20px; border-top: 2px solid #1a1a1a;"><span>TOTAL PAGADO:</span><span>' +
      escapeHtml(formatCurrency(factura.valor)) +
      "</span></div></div>" +
      '<div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e5e5; text-align: center; font-size: 11px; color: #666; line-height: 1.8;"><p><strong>Este documento es un comprobante de pago generado electrónicamente.</strong></p>' +
      "<p>Fecha de generación: " +
      escapeHtml(
        new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      ) +
      "</p>" +
      '<div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border: 1px dashed #999; font-family: Courier New, monospace; font-size: 10px; letter-spacing: 2px; color: #333;">CÓDIGO DE VERIFICACIÓN: ' +
      escapeHtml(codigoComprobante) +
      "</div>" +
      '<p style="margin-top: 15px; font-size: 10px;">Este comprobante puede ser verificado en el sistema de gestión del condominio.<br>Cualquier alteración o falsificación de este documento es ilegal y está sujeta a acciones legales.</p></div></div></div>';

    // Función para cargar html2pdf y generar el PDF
    const loadHtml2Pdf = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }

        // Cargar html2pdf.js desde CDN
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = () => reject(new Error("Error al cargar html2pdf.js"));
        document.head.appendChild(script);
      });
    };

    // Generar y descargar el PDF
    loadHtml2Pdf()
      .then((html2pdf: any) => {
        // Crear un iframe oculto para aislar completamente los estilos y evitar conflictos con CSS moderno
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.width = "800px";
        iframe.style.height = "1200px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        // Esperar a que el iframe cargue
        iframe.onload = () => {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            toast.dismiss("generating-pdf");
            toast.error("Error al generar el PDF. Intenta nuevamente.", {
              duration: 3000,
            });
            return;
          }

          // Escribir el HTML completo con estilos inline en el iframe para evitar conflictos CSS
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  body {
                    font-family: Georgia, 'Times New Roman', serif;
                    color: rgb(26, 26, 26);
                    background: rgb(255, 255, 255);
                    padding: 40px 50px;
                    max-width: 800px;
                    margin: 0 auto;
                    position: relative;
                  }
                </style>
              </head>
              <body>
                ${htmlContent}
              </body>
            </html>
          `);
          iframeDoc.close();

          // Esperar un momento para que el iframe renderice completamente
          setTimeout(() => {
            const element = iframeDoc.body.firstElementChild as HTMLElement;
            if (!element) {
              document.body.removeChild(iframe);
              toast.dismiss("generating-pdf");
              toast.error("Error al generar el PDF. Intenta nuevamente.", {
                duration: 3000,
              });
              return;
            }

            // Configuración para el PDF con opciones más compatibles
            const opt = {
              margin: [10, 10, 10, 10],
              filename: `Comprobante_${factura.numeroFactura}_${codigoComprobante}.pdf`,
              image: { type: "jpeg" as const, quality: 0.98 },
              html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                windowWidth: 800,
                windowHeight: 1200,
                backgroundColor: "#ffffff",
                ignoreElements: (element: HTMLElement) => {
                  // Ignorar elementos que puedan causar problemas
                  return false;
                },
              },
              jsPDF: {
                unit: "mm" as const,
                format: "a4" as const,
                orientation: "portrait" as const,
                compress: true,
              },
            };

            // Generar y descargar el PDF
            html2pdf()
              .set(opt)
              .from(element)
              .save()
              .then(() => {
                // Eliminar el iframe temporal
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                toast.dismiss("generating-pdf");
                toast.success("Comprobante descargado exitosamente", {
                  duration: 2000,
                });
              })
              .catch((error: any) => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                toast.dismiss("generating-pdf");
                toast.error("Error al generar el PDF. Intenta nuevamente.", {
                  duration: 3000,
                });
                console.error("Error al generar PDF:", error);
              });
          }, 500);
        };

        // Forzar la carga del iframe
        iframe.src = "about:blank";
      })
      .catch((error) => {
        toast.dismiss("generating-pdf");
        toast.error("Error al cargar la librería de PDF. Intenta nuevamente.", {
          duration: 3000,
        });
        console.error("Error al cargar html2pdf:", error);
      });
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
            <div
              className={`p-6 rounded-lg border-2 ${
                estaAlDia
                  ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"
                  : misPagos.resumen.vencidas.cantidad > 0
                  ? "border-red-500/30 bg-red-50 dark:bg-red-950/20"
                  : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Semáforo */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Verde - Al día */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all ${
                      estaAlDia
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 dark:ring-emerald-600"
                        : "bg-gray-300 dark:bg-gray-600 opacity-40"
                    }`}
                  />
                  {/* Amarillo - Pendientes */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all ${
                      !estaAlDia && misPagos.resumen.vencidas.cantidad === 0
                        ? "bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300 dark:ring-amber-600"
                        : "bg-gray-300 dark:bg-gray-600 opacity-40"
                    }`}
                  />
                  {/* Rojo - Vencidas */}
                  <div
                    className={`w-5 h-5 rounded-full transition-all ${
                      misPagos.resumen.vencidas.cantidad > 0
                        ? "bg-red-500 shadow-lg shadow-red-500/50 ring-2 ring-red-300 dark:ring-red-600"
                        : "bg-gray-300 dark:bg-gray-600 opacity-40"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-xl mb-1 ${
                      estaAlDia
                        ? "text-emerald-700 dark:text-emerald-300"
                        : misPagos.resumen.vencidas.cantidad > 0
                        ? "text-red-700 dark:text-red-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {estaAlDia
                      ? "Estás al día"
                      : misPagos.resumen.vencidas.cantidad > 0
                      ? "Tienes facturas vencidas"
                      : "Tienes facturas pendientes"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {misPagos.resumen.vencidas.cantidad > 0
                      ? `${misPagos.resumen.vencidas.cantidad} factura${
                          misPagos.resumen.vencidas.cantidad > 1 ? "s" : ""
                        } vencida${
                          misPagos.resumen.vencidas.cantidad > 1 ? "s" : ""
                        } por un total de ${formatCurrency(
                          misPagos.resumen.vencidas.valor
                        )}`
                      : misPagos.resumen.pendientes.cantidad > 0
                      ? `${misPagos.resumen.pendientes.cantidad} factura${
                          misPagos.resumen.pendientes.cantidad > 1 ? "s" : ""
                        } pendiente${
                          misPagos.resumen.pendientes.cantidad > 1 ? "s" : ""
                        } por un total de ${formatCurrency(
                          misPagos.resumen.pendientes.valor
                        )}`
                      : "Todas tus facturas están pagadas"}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 border-2  rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Pendientes
                </p>
                <p className="text-3xl font-bold mb-1">
                  {misPagos.resumen.pendientes.cantidad}
                </p>
                <p className="text-sm font-medium ">
                  {formatCurrency(misPagos.resumen.pendientes.valor)}
                </p>
              </div>
              <div className="p-5 border-2 rounded-lg bg-red-50/50 dark:bg-red-950/10">
                <p className="text-xs font-semibold  uppercase tracking-wider mb-3">
                  Vencidas
                </p>
                <p className="text-3xl font-bold  mb-1">
                  {misPagos.resumen.vencidas.cantidad}
                </p>
                <p className="text-sm font-medium ">
                  {formatCurrency(misPagos.resumen.vencidas.valor)}
                </p>
              </div>
              <div className="p-5 border-2 rounded-lg  bg-green-50/50 dark:bg-green-950/10">
                <p className="text-xs font-semibold  uppercase tracking-wider mb-3">
                  Pagadas
                </p>
                <p className="text-3xl font-bold  mb-1">
                  {misPagos.resumen.pagadas.cantidad}
                </p>
                <p className="text-sm font-medium ">
                  {misPagos.resumen.pagadas.cantidad > 0
                    ? "Completadas"
                    : "Sin pagos"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Próximo Pago */}
        {(proximoPago || (estaAlDia && proximoPeriodoInfo)) && (
          <div className="mb-10 p-6 border rounded-lg">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold">Próximo Pago</span>
                  {proximoPago && getEstadoBadge(proximoPago.estado)}
                </div>
                {proximoPago ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      {proximoPago.descripcion ||
                        `Cuota de administración ${proximoPago.periodo}`}
                    </p>
                    <p className="text-sm font-medium mb-1">
                      Factura: {proximoPago.numeroFactura}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence el {formatDate(proximoPago.fechaVencimiento)}
                    </p>
                    {proximoPago.estado === "PAGADA" &&
                      proximoPago.fechaPago && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">
                            Pagada el {formatDate(proximoPago.fechaPago)}
                          </p>
                          {proximoPeriodoInfo && (
                            <p className="text-xs font-medium mt-2">
                              Próximo período:{" "}
                              {proximoPeriodoInfo.periodoFormateado}
                            </p>
                          )}
                        </>
                      )}
                  </>
                ) : proximoPeriodoInfo ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Próxima cuota de administración
                    </p>
                    <p className="text-sm font-medium mb-1">
                      Período: {proximoPeriodoInfo.periodoFormateado}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      La factura se generará próximamente
                    </p>
                  </>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                {proximoPago ? (
                  <>
                    <p className="text-2xl font-bold mb-3">
                      {formatCurrency(proximoPago.valor)}
                    </p>
                    {puedePagar(proximoPago) ? (
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
                    ) : proximoPago.estado === "PAGADA" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleVerComprobante(proximoPago)}
                      >
                        <IconFileText className="size-4 mr-2" />
                        Ver Comprobante
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pendiente de generación
                  </p>
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
                {misPagos
                  ? `${misPagos.total} factura${
                      misPagos.total !== 1 ? "s" : ""
                    } en total`
                  : "Cargando..."}
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

                  return (
                    <div
                      key={factura.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-semibold text-base">
                            {factura.numeroFactura}
                          </span>
                          {getEstadoBadge(factura.estado)}
                          {isPagada && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <IconCheck className="size-4" />
                              <span className="text-xs font-medium">
                                Pagada
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {factura.descripcion ||
                            `Cuota de administración ${factura.periodo}`}
                        </p>
                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          <span className="font-medium text-muted-foreground">
                            Vence: {formatDate(factura.fechaVencimiento)}
                          </span>
                          {factura.fechaPago && (
                            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                              <IconCheck className="size-3" />
                              Pagado: {formatDate(factura.fechaPago)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-lg font-bold">
                          {formatCurrency(factura.valor)}
                        </span>
                        {isPagada ? (
                          <Button
                            onClick={() => handleVerComprobante(factura)}
                            size="sm"
                            variant="outline"
                          >
                            <IconFileText className="size-4 mr-2" />
                            Ver Comprobante
                          </Button>
                        ) : puedePagar(factura) ? (
                          <Button
                            onClick={() => handlePagar(factura)}
                            size="sm"
                            variant="default"
                            disabled={crearPagoMutation.isPending}
                          >
                            {crearPagoMutation.isPending
                              ? "Procesando..."
                              : "Pagar"}
                          </Button>
                        ) : null}
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
                    Página {page} • {misPagos.facturas.length} de{" "}
                    {misPagos.total}
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
              <p className="text-muted-foreground">
                No hay facturas disponibles
              </p>
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
              {facturaSeleccionada &&
                `Pagar la factura ${facturaSeleccionada.numeroFactura}`}
            </DialogDescription>
          </DialogHeader>

          {pagoCreado && pagoCreado.paymentLink ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Redirigiendo a Wompi para completar el pago...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Si no eres redirigido automáticamente, haz clic en el botón de
                  abajo.
                </p>
              </div>
              <Button
                onClick={() => {
                  const link =
                    pagoCreado.paymentLink || pagoCreado.wompiPaymentLink;
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
                  <span className="text-sm font-medium text-muted-foreground">
                    Factura:
                  </span>
                  <span className="text-sm font-semibold">
                    {facturaSeleccionada.numeroFactura}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Valor a pagar:
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(facturaSeleccionada.valor)}
                  </span>
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
                    <option value="WOMPI">
                      Wompi (Tarjeta, PSE, etc.) - Procesamiento automático
                    </option>
                    <option value="EFECTIVO">
                      Efectivo - Se marca como completado automáticamente
                    </option>
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
                <Button
                  type="submit"
                  disabled={crearPagoMutation.isPending}
                  size="lg"
                >
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
