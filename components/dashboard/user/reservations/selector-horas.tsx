"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Hora {
  hora: string;
  ocupada: boolean;
  pasada: boolean;
}

interface SelectorHorasProps {
  horas: Hora[];
  horaSeleccionada: string;
  onHoraSeleccionada: (hora: string) => void;
  disabled?: boolean;
  label: string;
}

export function SelectorHoras({
  horas,
  horaSeleccionada,
  onHoraSeleccionada,
  disabled = false,
  label,
}: SelectorHorasProps) {
  if (horas.length === 0) {
    return (
      <div className="border rounded-lg p-2 sm:p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay horas disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-2 sm:p-4 bg-muted/30 max-h-48 overflow-y-auto">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {horas.map(({ hora, ocupada, pasada }) => {
          const seleccionada = horaSeleccionada === hora;
          const deshabilitada = ocupada || pasada;
          return (
            <button
              key={hora}
              type="button"
              onClick={() => !deshabilitada && onHoraSeleccionada(hora)}
              disabled={disabled || deshabilitada}
              className={cn(
                "px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm border transition-colors",
                deshabilitada
                  ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50 border-muted"
                  : seleccionada
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-background hover:bg-muted border-input"
              )}
              title={
                ocupada 
                  ? "Esta hora está ocupada" 
                  : pasada 
                  ? "Esta hora ya pasó" 
                  : ""
              }
            >
              {hora}
            </button>
          );
        })}
      </div>
    </div>
  );
}


