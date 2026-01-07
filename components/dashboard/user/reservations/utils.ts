export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (amount: number | null) => {
  if (!amount || amount === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (date: Date) => {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
};

export const getTipoEspacioLabel = (tipo: string) => {
  const tipos: Record<string, string> = {
    SALON_SOCIAL: "Salón Social",
    ZONA_BBQ: "Zona BBQ",
    SAUNA: "Sauna",
    CASA_EVENTOS: "Casa de Eventos",
    GIMNASIO: "Gimnasio",
    PISCINA: "Piscina",
    CANCHA_DEPORTIVA: "Cancha Deportiva",
    PARQUEADERO: "Parqueadero",
    OTRO: "Otro",
  };
  return tipos[tipo] || tipo;
};

export const obtenerDiaSemana = (fechaStr: string): number => {
  if (!fechaStr || !fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return -1;
  }
  const [año, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(año, mes - 1, dia);
  return fecha.getDay();
};

export const parsearFechaLocal = (fechaLocal: string): { fechaStr: string; horaMinuto: string; diaSemana: number } | null => {
  if (!fechaLocal) return null;
  
  const match = fechaLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  
  const [, año, mes, dia, hora, minuto] = match;
  const fechaStr = `${año}-${mes}-${dia}`;
  const horaMinuto = `${hora}:${minuto}`;
  
  const fechaObj = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
  const diaSemana = fechaObj.getDay();
  
  return { fechaStr, horaMinuto, diaSemana };
};


