"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconFileDownload } from "@tabler/icons-react";
import type { ReporteResponse, ReporteFilters } from "./generar-reporte";
import { formatCurrency, formatDate } from "./utils";

interface TablaReporteProps {
  reporteData: ReporteResponse;
  filters: ReporteFilters;
  onDescargarCSV: () => void;
}

export function TablaReporte({
  reporteData,
  filters,
  onDescargarCSV,
}: TablaReporteProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Datos del Reporte</CardTitle>
            <CardDescription>
              {reporteData.total} registros encontrados
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={onDescargarCSV}
            className="gap-2"
          >
            <IconFileDownload className="size-4" />
            Descargar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reporteData.datos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos para mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {Object.keys(reporteData.datos[0]).map((key) => (
                    <th
                      key={key}
                      className="text-left p-3 font-semibold text-sm"
                    >
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporteData.datos.slice(0, 100).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-muted/50"
                  >
                    {Object.values(row).map((value: any, colIdx) => (
                      <td key={colIdx} className="p-3 text-sm">
                        {typeof value === "number" &&
                        value > 1000 &&
                        !String(value).includes(".")
                          ? formatCurrency(value)
                          : typeof value === "string" &&
                            value.match(/^\d{4}-\d{2}-\d{2}/)
                          ? formatDate(value)
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reporteData.datos.length > 100 && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Mostrando los primeros 100 de {reporteData.total}{" "}
                registros. Descarga el CSV para ver todos los datos.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


