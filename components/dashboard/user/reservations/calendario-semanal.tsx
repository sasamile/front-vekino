"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Reserva } from "@/types/types";
import { formatTime, formatDateShort } from "./utils";

interface CalendarioSemanalProps {
  reservasSemana: Reserva[];
  isLoading: boolean;
  selectedFecha: Date;
  onSemanaChange: (direccion: 'anterior' | 'siguiente') => void;
  onHoyClick: () => void;
}

export function CalendarioSemanal({
  reservasSemana,
  isLoading,
  selectedFecha,
  onSemanaChange,
  onHoyClick,
}: CalendarioSemanalProps) {
  const getDiasSemana = () => {
    const fecha = new Date(selectedFecha);
    const diaSemana = fecha.getDay();
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - diaSemana);
    
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      dias.push(dia);
    }
    return dias;
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
              Reservas de la Semana
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Reservas confirmadas para esta semana
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSemanaChange('anterior')}
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
              onClick={() => onSemanaChange('siguiente')}
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
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
              <div
                key={dia}
                className="hidden sm:block text-center text-xs sm:text-sm font-semibold text-muted-foreground pb-2"
              >
                {dia}
              </div>
            ))}
            
            {getDiasSemana().map((dia, index) => {
              const fechaStr = dia.toISOString().split('T')[0];
              const reservasDelDia = reservasPorDia[fechaStr] || [];
              const esHoy = fechaStr === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] sm:min-h-[120px] border rounded-lg p-2 sm:p-2",
                    esHoy && "border-primary border-2 bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-xs sm:text-sm font-medium mb-2",
                    esHoy && "text-primary font-bold"
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


