import type { DisponibilidadCompletaResponse, HorarioDisponibilidad } from "@/types/types";
import { obtenerDiaSemana } from "./utils";

export const obtenerTodasLasHoras = (
  fechaStr: string,
  disponibilidad: DisponibilidadCompletaResponse | null,
  horariosDisponibilidad: HorarioDisponibilidad[] | null
): Array<{ hora: string; ocupada: boolean; pasada: boolean }> => {
  if (!disponibilidad || !horariosDisponibilidad) {
    return [];
  }
  
  const diaSemana = obtenerDiaSemana(fechaStr);
  
  if (disponibilidad.diasNoDisponibles.includes(diaSemana)) {
    return [];
  }
  
  const horarioDia = horariosDisponibilidad.find((h) => h.dia === diaSemana);
  if (!horarioDia) {
    return [];
  }
  
  const ahora = new Date();
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
  
  const horas: Array<{ hora: string; ocupada: boolean; pasada: boolean }> = [];
  const [horaInicio, minutoInicio] = horarioDia.horaInicio.split(':').map(Number);
  const [horaFin, minutoFin] = horarioDia.horaFin.split(':').map(Number);
  
  const horasOcupadas = disponibilidad.horasOcupadasPorDia[fechaStr] || [];
  
  const rangosOcupados = horasOcupadas.map(ocupada => {
    const [ocupadaHoraInicio, ocupadaMinutoInicio] = ocupada.horaInicio.split(':').map(Number);
    const [ocupadaHoraFin, ocupadaMinutoFin] = ocupada.horaFin.split(':').map(Number);
    return {
      inicioMinutos: ocupadaHoraInicio * 60 + ocupadaMinutoInicio,
      finMinutos: ocupadaHoraFin * 60 + ocupadaMinutoFin,
    };
  });
  
  const horaInicioMinutos = horaInicio * 60 + minutoInicio;
  const horaFinMinutos = horaFin * 60 + minutoFin;
  
  for (let minutosActuales = horaInicioMinutos; minutosActuales <= horaFinMinutos; minutosActuales += 30) {
    const hora = Math.floor(minutosActuales / 60);
    const minuto = minutosActuales % 60;
    const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    
    const estaOcupada = rangosOcupados.some(rango => {
      return minutosActuales >= rango.inicioMinutos && minutosActuales <= rango.finMinutos;
    });
    
    const esPasada = fechaStr === hoyStr && minutosActuales < horaActualMinutos;
    
    horas.push({ hora: horaStr, ocupada: estaOcupada, pasada: esPasada });
  }
  
  return horas;
};


