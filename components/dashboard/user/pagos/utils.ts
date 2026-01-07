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
    factura.estado === "ENVIADA"
  );
};

