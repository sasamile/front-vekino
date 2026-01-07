"use client";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { CalendarioSeleccion } from "./calendario-seleccion";
import { SelectorHoras } from "./selector-horas";
import { obtenerTodasLasHoras } from "./obtener-horas";
import { getTipoEspacioLabel } from "./utils";
import type { EspacioComun, DisponibilidadCompletaResponse, HorarioDisponibilidad } from "@/types/types";

interface FormularioReservaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  espaciosDisponibles: EspacioComun[];
  espacioSeleccionado: EspacioComun | undefined;
  disponibilidad: DisponibilidadCompletaResponse | null;
  horariosDisponibilidad: HorarioDisponibilidad[] | null;
  fechaSeleccionada: string;
  horaInicioSeleccionada: string;
  horaFinSeleccionada: string;
  mesActual: Date;
  minHora: string;
  maxHora: string;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  onMesChange: (mes: Date) => void;
  onFechaSeleccionada: (fechaStr: string, diaSemana: number) => void;
  onHoraInicioSeleccionada: (hora: string) => void;
  onHoraFinSeleccionada: (hora: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  esDiaDisponibleCalendario: (diaSemana: number, fechaStr: string) => boolean;
  tieneHorasDisponibles: (fechaStr: string) => boolean;
}

export function FormularioReserva({
  open,
  onOpenChange,
  espaciosDisponibles,
  espacioSeleccionado,
  disponibilidad,
  horariosDisponibilidad,
  fechaSeleccionada,
  horaInicioSeleccionada,
  horaFinSeleccionada,
  mesActual,
  minHora,
  maxHora,
  register,
  errors,
  watch,
  setValue,
  clearErrors,
  onMesChange,
  onFechaSeleccionada,
  onHoraInicioSeleccionada,
  onHoraFinSeleccionada,
  onSubmit,
  isPending,
  esDiaDisponibleCalendario,
  tieneHorasDisponibles,
}: FormularioReservaProps) {
  const fechaInicio = watch("fechaInicio");
  const espacioComunId = watch("espacioComunId");

  const obtenerHoras = (fechaStr: string) => {
    return obtenerTodasLasHoras(fechaStr, disponibilidad, horariosDisponibilidad);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reserva</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva reserva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Espacio Común *</FieldLabel>
              <select
                {...register("espacioComunId")}
                disabled={isPending || espaciosDisponibles.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {espaciosDisponibles.length === 0 ? "Cargando espacios..." : "Selecciona un espacio"}
                </option>
                {espaciosDisponibles.map((espacio) => (
                  <option key={espacio.id} value={espacio.id}>
                    {espacio.nombre} - {getTipoEspacioLabel(espacio.tipo)}
                  </option>
                ))}
              </select>
              {errors.espacioComunId && (
                <FieldError>{errors.espacioComunId.message}</FieldError>
              )}
            </Field>

            {espacioSeleccionado && disponibilidad && (
              <div className="space-y-4">
                <Field>
                  <FieldLabel>Selecciona la Fecha *</FieldLabel>
                  <CalendarioSeleccion
                    mesActual={mesActual}
                    fechaSeleccionada={fechaSeleccionada}
                    disponibilidad={disponibilidad}
                    tieneHorasDisponibles={tieneHorasDisponibles}
                    esDiaDisponibleCalendario={esDiaDisponibleCalendario}
                    onMesChange={onMesChange}
                    onFechaSeleccionada={onFechaSeleccionada}
                    disabled={isPending}
                  />
                  {errors.fechaInicio && (
                    <FieldError>{errors.fechaInicio.message}</FieldError>
                  )}
                </Field>

                {fechaSeleccionada && (
                  <>
                    <Field>
                      <FieldLabel>Hora de Inicio *</FieldLabel>
                      <SelectorHoras
                        horas={obtenerHoras(fechaSeleccionada)}
                        horaSeleccionada={horaInicioSeleccionada}
                        onHoraSeleccionada={onHoraInicioSeleccionada}
                        disabled={isPending}
                        label="Hora de Inicio"
                      />
                    </Field>

                    {horaInicioSeleccionada && (
                      <Field>
                        <FieldLabel>Hora de Fin *</FieldLabel>
                        <SelectorHoras
                          horas={obtenerHoras(fechaSeleccionada).filter(
                            ({ hora }) => hora > horaInicioSeleccionada
                          )}
                          horaSeleccionada={horaFinSeleccionada}
                          onHoraSeleccionada={onHoraFinSeleccionada}
                          disabled={isPending}
                          label="Hora de Fin"
                        />
                        {obtenerHoras(fechaSeleccionada).filter(
                          ({ hora }) => hora > horaInicioSeleccionada
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay horas disponibles después de {horaInicioSeleccionada}
                          </p>
                        )}
                        {errors.fechaFin && (
                          <FieldError>{errors.fechaFin.message}</FieldError>
                        )}
                      </Field>
                    )}
                  </>
                )}

                {/* Información de disponibilidad */}
                <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                  {horariosDisponibilidad && horariosDisponibilidad.length > 0 && (
                    <p>
                      <span className="font-semibold">Horarios:</span> {minHora} - {maxHora}
                    </p>
                  )}
                  {disponibilidad.diasNoDisponibles.length > 0 && (
                    <p>
                      <span className="font-semibold">Días no disponibles:</span>{" "}
                      {disponibilidad.diasNoDisponibles.map(d => {
                        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        return dias[d];
                      }).join(', ')}
                    </p>
                  )}
                  {fechaSeleccionada && disponibilidad.horasOcupadasPorDia[fechaSeleccionada] && (
                    <p>
                      <span className="font-semibold">Horas ocupadas este día:</span>{" "}
                      {disponibilidad.horasOcupadasPorDia[fechaSeleccionada].map(
                        (ocupada) => `${ocupada.horaInicio} - ${ocupada.horaFin}`
                      ).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(!espacioSeleccionado || !disponibilidad) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Fecha y Hora de Inicio *</FieldLabel>
                  <Input
                    type="datetime-local"
                    {...register("fechaInicio")}
                    disabled={isPending || !espacioSeleccionado}
                  />
                  {errors.fechaInicio && (
                    <FieldError>{errors.fechaInicio.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Fecha y Hora de Fin *</FieldLabel>
                  <Input
                    type="datetime-local"
                    {...register("fechaFin")}
                    disabled={isPending || !espacioSeleccionado}
                    min={fechaInicio || undefined}
                  />
                  {errors.fechaFin && (
                    <FieldError>{errors.fechaFin.message}</FieldError>
                  )}
                </Field>
              </div>
            )}

            <Field>
              <FieldLabel>Motivo</FieldLabel>
              <Input
                {...register("motivo")}
                placeholder="Ej: Celebración de cumpleaños"
                disabled={isPending}
              />
              {errors.motivo && (
                <FieldError>{errors.motivo.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

