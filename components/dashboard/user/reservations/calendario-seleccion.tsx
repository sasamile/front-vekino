"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { obtenerDiaSemana } from "./utils";

interface CalendarioSeleccionProps {
  mesActual: Date;
  fechaSeleccionada: string;
  disponibilidad: {
    diasNoDisponibles: number[];
    horasOcupadasPorDia: Record<string, Array<{ horaInicio: string; horaFin: string }>>;
  } | null;
  tieneHorasDisponibles: (fechaStr: string) => boolean;
  esDiaDisponibleCalendario: (diaSemana: number, fechaStr: string) => boolean;
  onMesChange: (mes: Date) => void;
  onFechaSeleccionada: (fechaStr: string, diaSemana: number) => void;
  disabled?: boolean;
}

export function CalendarioSeleccion({
  mesActual,
  fechaSeleccionada,
  disponibilidad,
  tieneHorasDisponibles,
  esDiaDisponibleCalendario,
  onMesChange,
  onFechaSeleccionada,
  disabled = false,
}: CalendarioSeleccionProps) {
  const diasDelMes = useMemo(() => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const dias: Array<{ fecha: Date | null; diaSemana: number | null; fechaStr: string | null }> = [];
    
    const diaSemanaPrimerDia = primerDia.getDay();
    for (let i = 0; i < diaSemanaPrimerDia; i++) {
      dias.push({ fecha: null, diaSemana: null, fechaStr: null });
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(año, mes, dia);
      const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      dias.push({
        fecha,
        diaSemana: fecha.getDay(),
        fechaStr,
      });
    }
    
    return dias;
  }, [mesActual]);

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => onMesChange(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
          disabled={disabled}
        >
          <span className="hidden sm:inline">← Anterior</span>
          <span className="sm:hidden">←</span>
        </Button>
        <span className="font-semibold text-sm sm:text-base text-center flex-1">
          {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => onMesChange(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
          disabled={disabled}
        >
          <span className="hidden sm:inline">Siguiente →</span>
          <span className="sm:hidden">→</span>
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
          <div key={dia} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground p-0.5 sm:p-1">
            {dia}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {diasDelMes.map(({ fecha, diaSemana, fechaStr }, index) => {
          if (!fecha || !fechaStr) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const diaSemanaCalculado = obtenerDiaSemana(fechaStr);
          const disponiblePorDiaSemana = esDiaDisponibleCalendario(diaSemanaCalculado, fechaStr);
          const tieneHoras = tieneHorasDisponibles(fechaStr);
          const disponible = disponiblePorDiaSemana && tieneHoras;
          const seleccionada = fechaSeleccionada === fechaStr;
          const hoy = new Date();
          const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
          const esHoy = fechaStr === hoyStr;
          
          const nombreDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemanaCalculado];
          
          let tooltip = `${nombreDia} ${fecha.getDate()}`;
          if (!disponiblePorDiaSemana) {
            tooltip += " - Día no disponible";
          } else if (!tieneHoras) {
            tooltip += " - Sin horas disponibles";
          }
          
          return (
            <button
              key={fechaStr}
              type="button"
              onClick={() => onFechaSeleccionada(fechaStr, diaSemanaCalculado)}
              disabled={!disponible || disabled}
              title={tooltip}
              className={cn(
                "aspect-square rounded-md text-[10px] sm:text-sm transition-colors flex flex-col items-center justify-center",
                disponible
                  ? seleccionada
                    ? "bg-primary text-primary-foreground font-semibold"
                    : esHoy
                    ? "bg-primary/20 hover:bg-primary/30 font-medium border-2 border-primary"
                    : "bg-background hover:bg-muted border border-input"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span className="text-[8px] sm:text-xs opacity-70 hidden sm:block">{nombreDia}</span>
              <span className="font-medium">{fecha.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary"></div>
          <span>Seleccionada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-muted/50"></div>
          <span>No disponible</span>
        </div>
      </div>
    </div>
  );
}


