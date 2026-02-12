"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Reserva } from "@/types/types";
import { formatTime, formatDateShort } from "./utils";

export type VistaCalendario = "semana" | "quincena" | "mes";

interface CalendarioSemanalProps {
  reservasSemana: Reserva[];
  isLoading: boolean;
  selectedFecha: Date;
  vista: VistaCalendario;
  onVistaChange: (vista: VistaCalendario) => void;
  onPeriodoChange: (direccion: 'anterior' | 'siguiente') => void;
  onHoyClick: () => void;
}

export function CalendarioSemanal({
  reservasSemana,
  isLoading,
  selectedFecha,
  vista,
  onVistaChange,
  onPeriodoChange,
  onHoyClick,
}: CalendarioSemanalProps) {
  const getDiasVista = () => {
    const fecha = new Date(selectedFecha);
    const dias: Date[] = [];
    
    if (vista === "semana") {
      const diaSemana = fecha.getDay();
      const inicioSemana = new Date(fecha);
      inicioSemana.setDate(fecha.getDate() - diaSemana);
      
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        dias.push(dia);
      }
    } else if (vista === "quincena") {
      // Quincena: 15 días desde el inicio de la semana actual
      const diaSemana = fecha.getDay();
      const inicioSemana = new Date(fecha);
      inicioSemana.setDate(fecha.getDate() - diaSemana);
      
      for (let i = 0; i < 15; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        dias.push(dia);
      }
    } else if (vista === "mes") {
      // Mes: todos los días del mes actual
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const primerDia = new Date(año, mes, 1);
      const ultimoDia = new Date(año, mes + 1, 0);
      
      // Ajustar para que empiece en domingo
      const diaSemanaPrimerDia = primerDia.getDay();
      const inicioVista = new Date(primerDia);
      inicioVista.setDate(primerDia.getDate() - diaSemanaPrimerDia);
      
      // Calcular cuántos días mostrar (desde el domingo anterior hasta el sábado después del último día)
      const diasTotales = ultimoDia.getDate() + diaSemanaPrimerDia;
      const semanasCompletas = Math.ceil(diasTotales / 7);
      const diasAMostrar = semanasCompletas * 7;
      
      for (let i = 0; i < diasAMostrar; i++) {
        const dia = new Date(inicioVista);
        dia.setDate(inicioVista.getDate() + i);
        dias.push(dia);
      }
    }
    
    return dias;
  };

  const getTituloVista = () => {
    switch (vista) {
      case "semana":
        return "Reservas de la Semana";
      case "quincena":
        return "Reservas de la Quincena";
      case "mes":
        return "Reservas del Mes";
      default:
        return "Reservas";
    }
  };

  const getDescripcionVista = () => {
    switch (vista) {
      case "semana":
        return "Reservas confirmadas para esta semana";
      case "quincena":
        return "Reservas confirmadas para los próximos 15 días";
      case "mes":
        return "Reservas confirmadas para este mes";
      default:
        return "Reservas confirmadas";
    }
  };

  const getEtiquetaVista = (v: VistaCalendario) => {
    switch (v) {
      case "semana":
        return "Semana";
      case "quincena":
        return "Quincena";
      case "mes":
        return "Mes";
    }
  };

  const reservasPorDia = reservasSemana.reduce((acc, reserva) => {
    const fechaInicio = new Date(reserva.fechaInicio);
    const fechaStr = fechaInicio.toISOString().split('T')[0];
    
    if (!acc[fechaStr]) {
      acc[fechaStr] = [];
    }
    acc[fechaStr].push(reserva);
    return acc;
  }, {} as Record<string, Reserva[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <IconCalendar className="size-4 sm:size-5" />
              {getTituloVista()}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {getDescripcionVista()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  {getEtiquetaVista(vista)}
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onVistaChange("semana")}>
                  Semana
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onVistaChange("quincena")}>
                  Quincena (15 días)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onVistaChange("mes")}>
                  Mes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPeriodoChange('anterior')}
              className="flex-1 sm:flex-initial"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onHoyClick}
              className="flex-1 sm:flex-initial"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPeriodoChange('siguiente')}
              className="flex-1 sm:flex-initial"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className={cn(
            "grid gap-2",
            vista === "semana" && "grid-cols-1 sm:grid-cols-7",
            vista === "quincena" && "grid-cols-1 sm:grid-cols-7",
            vista === "mes" && "grid-cols-1 sm:grid-cols-7"
          )}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
              <div
                key={dia}
                className="hidden sm:block text-center text-xs sm:text-sm font-semibold text-muted-foreground pb-2"
              >
                {dia}
              </div>
            ))}
            
            {getDiasVista().map((dia, index) => {
              const fechaStr = dia.toISOString().split('T')[0];
              const reservasDelDia = reservasPorDia[fechaStr] || [];
              const esHoy = fechaStr === new Date().toISOString().split('T')[0];
              
              // Para vista de mes, verificar si el día pertenece al mes actual
              const esDelMesActual = vista === "mes" 
                ? dia.getMonth() === selectedFecha.getMonth() 
                : true;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] sm:min-h-[120px] border rounded-lg p-2 sm:p-2",
                    esHoy && "border-primary border-2 bg-primary/5",
                    !esDelMesActual && vista === "mes" && "opacity-40"
                  )}
                >
                  <div className={cn(
                    "text-xs sm:text-sm font-medium mb-2",
                    esHoy && "text-primary font-bold",
                    !esDelMesActual && vista === "mes" && "text-muted-foreground"
                  )}>
                    {formatDateShort(dia)}
                  </div>
                  <div className="space-y-1">
                    {reservasDelDia.length > 0 ? (
                      reservasDelDia.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="text-[10px] sm:text-xs p-1 sm:p-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                          title={`${reserva.espacioComun?.nombre || "Espacio"} - ${formatTime(reserva.fechaInicio)} - ${formatTime(reserva.fechaFin)}`}
                        >
                          <div className="font-semibold truncate">
                            {reserva.espacioComun?.nombre || "Espacio"}
                          </div>
                          <div className="text-muted-foreground">
                            {formatTime(reserva.fechaInicio)} - {formatTime(reserva.fechaFin)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] sm:text-xs text-muted-foreground text-center py-1">
                        Sin reservas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


