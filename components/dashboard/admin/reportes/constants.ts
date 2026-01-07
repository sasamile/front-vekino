export type TipoReporte =
  | "PAGOS"
  | "FACTURAS"
  | "CLIENTES"
  | "RESERVAS"
  | "RECAUDO"
  | "MOROSIDAD";

export type FormatoReporte = "JSON" | "CSV";

export const TIPO_REPORTE_OPTIONS: { value: TipoReporte; label: string }[] = [
  { value: "PAGOS", label: "Pagos" },
  { value: "FACTURAS", label: "Facturas" },
  { value: "CLIENTES", label: "Clientes" },
  { value: "RESERVAS", label: "Reservas" },
  { value: "RECAUDO", label: "Recaudo" },
  { value: "MOROSIDAD", label: "Morosidad" },
];

export const ESTADOS_PAGOS = [
  "PENDIENTE",
  "PROCESANDO",
  "APROBADO",
  "RECHAZADO",
  "CANCELADO",
];

export const ESTADOS_FACTURAS = [
  "PENDIENTE",
  "ENVIADA",
  "PAGADA",
  "VENCIDA",
  "CANCELADA",
];

export const ESTADOS_RESERVAS = [
  "PENDIENTE",
  "CONFIRMADA",
  "CANCELADA",
  "COMPLETADA",
];

export function getEstadosOptions(tipoReporte: TipoReporte): string[] {
  switch (tipoReporte) {
    case "PAGOS":
      return ESTADOS_PAGOS;
    case "FACTURAS":
      return ESTADOS_FACTURAS;
    case "RESERVAS":
      return ESTADOS_RESERVAS;
    default:
      return [];
  }
}


