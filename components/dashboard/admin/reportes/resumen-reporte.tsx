"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReporteResponse } from "./generar-reporte";
import { formatDate } from "./utils";

interface ResumenReporteProps {
  reporteData: ReporteResponse;
}

export function ResumenReporte({ reporteData }: ResumenReporteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del Reporte</CardTitle>
        <CardDescription>
          Generado el {formatDate(reporteData.fechaGeneracion)} -{" "}
          {reporteData.periodo}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(reporteData.resumen).map(([key, value]) => (
            <div
              key={key}
              className="p-4 border rounded-lg bg-muted/50"
            >
              <div className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className="text-2xl font-bold mt-1">
                {typeof value === "number"
                  ? value.toLocaleString("es-CO")
                  : String(value)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total de registros: {reporteData.total}
        </div>
      </CardContent>
    </Card>
  );
}


