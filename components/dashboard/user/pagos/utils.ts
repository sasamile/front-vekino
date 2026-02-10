export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const puedePagar = (factura: any) => {
  if ("puedePagar" in factura && typeof factura.puedePagar === "boolean") {
    return factura.puedePagar;
  }
  return (
    factura.estado === "PENDIENTE" ||
    factura.estado === "VENCIDA" ||
    factura.estado === "ENVIADA" ||
    factura.estado === "ABONADO"
  );
};

/** Valor a considerar como facturado: con descuento si existe, sino valor. */
export function getValorFacturado(factura: {
  valor: number;
  valorConDescuento?: number | null;
}): number {
  return factura.valorConDescuento ?? factura.valor;
}

/**
 * Saldo pendiente correcto: valor facturado (con descuento) menos total pagado.
 * Si el backend envía saldoPendiente basado en valor sin descuento, lo recalculamos aquí.
 */
export function getSaldoPendiente(factura: {
  valor: number;
  valorConDescuento?: number | null;
  totalPagado?: number | null;
  saldoPendiente?: number | null;
}): number {
  const valorFacturado = getValorFacturado(factura);
  if (factura.totalPagado != null && factura.totalPagado >= 0) {
    return Math.max(0, valorFacturado - factura.totalPagado);
  }
  return factura.saldoPendiente ?? 0;
}

