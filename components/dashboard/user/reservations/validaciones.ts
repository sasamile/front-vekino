import type { DisponibilidadCompletaResponse, HorarioDisponibilidad } from "@/types/types";
import { parsearFechaLocal, obtenerDiaSemana } from "./utils";

export const esDiaDisponible = (
  fecha: string,
  disponibilidad: DisponibilidadCompletaResponse | null
): boolean => {
  if (!fecha || !disponibilidad) return true;
  
  const parsed = parsearFechaLocal(fecha);
  if (!parsed) return true;
  
  return !disponibilidad.diasNoDisponibles.includes(parsed.diaSemana);
};

export const esHoraDisponible = (
  fechaHora: string,
  disponibilidad: DisponibilidadCompletaResponse | null,
  horariosDisponibilidad: HorarioDisponibilidad[] | null
): boolean => {
  if (!fechaHora) return true;

  const parsed = parsearFechaLocal(fechaHora);
  if (!parsed) return true;

  const { fechaStr, horaMinuto, diaSemana } = parsed;

  if (disponibilidad && disponibilidad.diasNoDisponibles.includes(diaSemana)) {
    return false;
  }

  if (horariosDisponibilidad && horariosDisponibilidad.length > 0) {
    const horarioDia = horariosDisponibilidad.find((h) => h.dia === diaSemana);
    if (!horarioDia) {
      return false;
    }
    if (horaMinuto < horarioDia.horaInicio || horaMinuto > horarioDia.horaFin) {
      return false;
    }
  }

  if (disponibilidad?.horasOcupadasPorDia[fechaStr]) {
    const horasOcupadas = disponibilidad.horasOcupadasPorDia[fechaStr];
    for (const ocupada of horasOcupadas) {
      if (horaMinuto >= ocupada.horaInicio && horaMinuto < ocupada.horaFin) {
        return false;
      }
    }
  }

  return true;
};

export const esRangoHorasDisponible = (
  fechaInicio: string,
  fechaFin: string,
  disponibilidad: DisponibilidadCompletaResponse | null
): boolean => {
  if (!fechaInicio || !fechaFin) return true;

  const parsedInicio = parsearFechaLocal(fechaInicio);
  const parsedFin = parsearFechaLocal(fechaFin);
  
  if (!parsedInicio || !parsedFin) return true;

  if (parsedInicio.fechaStr !== parsedFin.fechaStr) {
    return false;
  }

  if (disponibilidad?.horasOcupadasPorDia[parsedInicio.fechaStr]) {
    const horasOcupadas = disponibilidad.horasOcupadasPorDia[parsedInicio.fechaStr];
    const horaInicio = parsedInicio.horaMinuto;
    const horaFin = parsedFin.horaMinuto;

    for (const ocupada of horasOcupadas) {
      if (
        (horaInicio < ocupada.horaFin && horaFin > ocupada.horaInicio)
      ) {
        return false;
      }
    }
  }

  return true;
};

export const esDiaDisponibleCalendario = (
  diaSemana: number,
  fechaStr: string,
  disponibilidad: DisponibilidadCompletaResponse | null
): boolean => {
  if (!disponibilidad) return true;
  
  return !disponibilidad.diasNoDisponibles.includes(diaSemana);
};

export const tieneHorasDisponibles = (
  fechaStr: string,
  disponibilidad: DisponibilidadCompletaResponse | null,
  horariosDisponibilidad: HorarioDisponibilidad[] | null,
  obtenerTodasLasHorasFn: (fechaStr: string, disponibilidad: DisponibilidadCompletaResponse | null, horariosDisponibilidad: HorarioDisponibilidad[] | null) => Array<{ hora: string; ocupada: boolean; pasada: boolean }>
): boolean => {
  const horasDelDia = obtenerTodasLasHorasFn(fechaStr, disponibilidad, horariosDisponibilidad);
  return horasDelDia.some(h => !h.ocupada && !h.pasada);
};

