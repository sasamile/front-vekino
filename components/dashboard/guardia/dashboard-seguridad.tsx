"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  IconClipboardList,
  IconChecklist,
  IconWalk,
  IconCarCrash,
  IconVolume,
  IconTool,
  IconDoorExit,
  IconEye,
  IconFlag,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export interface MinutaEvent {
  id: number;
  time: string;
  module: string;
  type: string;
  unit: string;
  summary: string;
  status: string;
}

const MODULOS = ["Todos", "Visitantes", "Paquetería", "Reservas", "Novedades", "Avisos", "Minuta"];
const TIPOS_EVENTO = ["Todos", "Ingresos", "Salidas", "Alertas"];

export default function GuardiaSeguridadDashboard() {
  const [minutaEvents, setMinutaEvents] = useState<MinutaEvent[]>([
    { id: 1, time: "06:05", module: "Minuta", type: "Checklist", unit: "Portería", summary: "Recepción de puesto sin novedades. Armamento y llaves completas.", status: "Cerrado" },
    { id: 2, time: "07:15", module: "Visitantes", type: "Ingreso", unit: "T1-202", summary: "Ingreso Domiciliario Rappi", status: "Cerrado" },
    { id: 3, time: "08:30", module: "Paquetería", type: "Recibido", unit: "T2-505", summary: "Paquete Amazon recibido", status: "Abierto" },
    { id: 4, time: "09:00", module: "Avisos", type: "Sistema", unit: "Admin", summary: "Corte de luz programado confirmado", status: "Info" },
  ]);
  const [filterModule, setFilterModule] = useState("all");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [modalChecklist, setModalChecklist] = useState(false);
  const [modalRonda, setModalRonda] = useState(false);
  const [modalEndShift, setModalEndShift] = useState(false);
  const [rondaZone, setRondaZone] = useState("Perímetro Exterior");
  const [rondaNote, setRondaNote] = useState("");

  const logEvent = (event: Omit<MinutaEvent, "id" | "time">) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newEvent: MinutaEvent = {
      id: minutaEvents.length + 1,
      time: timeString,
      ...event,
    };
    setMinutaEvents((prev) => [newEvent, ...prev]);
    toast.success(`Evento registrado: ${event.type}`);
  };

  const filteredEvents = useMemo(() => {
    return minutaEvents.filter((e) => {
      if (filterModule !== "all" && e.module !== filterModule) return false;
      if (filterUnit && !e.unit.toLowerCase().includes(filterUnit.toLowerCase())) return false;
      if (filterSearch && !`${e.summary} ${e.unit} ${e.type}`.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [minutaEvents, filterModule, filterUnit, filterSearch]);

  const stats = useMemo(() => ({
    visitors: minutaEvents.filter((e) => e.module === "Visitantes").length,
    packages: minutaEvents.filter((e) => e.module === "Paquetería").length,
    incidents: minutaEvents.filter((e) => e.module === "Novedades" || e.type.includes("Mal Parqueado") || e.type.includes("Ruido") || e.type.includes("Daño")).length,
  }), [minutaEvents]);

  const badgeVariant = (module: string) => {
    switch (module) {
      case "Visitantes": return "default";
      case "Paquetería": return "secondary";
      case "Novedades": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Minuta Digital de Turno</h1>
          <p className="text-muted-foreground text-sm">Vista consolidada de eventos, control y seguimiento.</p>
        </div>
        <Button variant="destructive" onClick={() => setModalEndShift(true)} className="gap-2 shrink-0">
          <IconDoorExit className="size-4" />
          Cerrar Turno
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones de Control</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setModalChecklist(true)} className="gap-2">
            <IconChecklist className="size-4" />
            Checklist Inicio Turno
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalRonda(true)} className="gap-2">
            <IconWalk className="size-4" />
            Registrar Ronda
          </Button>
          <div className="border-l pl-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Reporte Rápido:</span>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => logEvent({ module: "Novedades", type: "Mal Parqueado", unit: "Portería/Ronda", summary: "Vehículo mal estacionado en bahía", status: "Abierto" })}>
              <IconCarCrash className="size-4" />
              Mal Parqueo
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => logEvent({ module: "Novedades", type: "Ruido Excesivo", unit: "Portería/Ronda", summary: "Queja de ruido reportada", status: "Abierto" })}>
              <IconVolume className="size-4" />
              Ruido
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => logEvent({ module: "Novedades", type: "Daño Visible", unit: "Portería/Ronda", summary: "Luz/Puerta averiada", status: "Abierto" })}>
              <IconTool className="size-4" />
              Daño
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Módulo</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              {MODULOS.map((m) => (
                <option key={m} value={m === "Todos" ? "all" : m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Tipo Evento</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <Label className="text-xs text-muted-foreground">Unidad</Label>
            <Input placeholder="T1-101" value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <Input placeholder="Nombre, Placa..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="h-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Hora</th>
                <th className="text-left p-3 text-sm font-medium">Módulo</th>
                <th className="text-left p-3 text-sm font-medium">Evento</th>
                <th className="text-left p-3 text-sm font-medium">Unidad / Actor</th>
                <th className="text-left p-3 text-sm font-medium">Detalle / Resumen</th>
                <th className="text-left p-3 text-sm font-medium">Estado</th>
                <th className="text-left p-3 text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b">
                  <td className="p-3 font-medium">{event.time}</td>
                  <td className="p-3">
                    <Badge variant={badgeVariant(event.module)}>{event.module}</Badge>
                  </td>
                  <td className="p-3 text-sm">{event.type}</td>
                  <td className="p-3 text-sm">{event.unit}</td>
                  <td className="p-3 text-sm text-muted-foreground">{event.summary}</td>
                  <td className="p-3">
                    <span className={event.status === "Abierto" ? "text-destructive font-semibold" : "text-green-600"}>
                      ● {event.status === "Abierto" ? "Pendiente" : "Cerrado"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                      <IconEye className="size-4" />
                    </Button>
                    {event.status === "Abierto" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Seguimiento">
                        <IconFlag className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Checklist */}
      <Dialog open={modalChecklist} onOpenChange={setModalChecklist}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconClipboardList className="size-5" />
              Checklist de Inicio de Turno
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {["Radios Comunicaciones (3)", "Linternas (2)", "Libro de Actas Físico", "Llaves Maestras", "Monitores CCTV Funcionando", "Portón Vehicular Operativo"].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-input" />
                {item}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Observaciones Iniciales</Label>
            <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" rows={2} placeholder="Opcional" />
          </div>
          <DialogFooter>
            <Button onClick={() => { logEvent({ module: "Minuta", type: "Checklist", unit: "Portería", summary: "Checklist de inicio OK", status: "Cerrado" }); setModalChecklist(false); }}>
              Confirmar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ronda */}
      <Dialog open={modalRonda} onOpenChange={setModalRonda}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconWalk className="size-5" />
              Registrar Ronda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zona Inspeccionada</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={rondaZone}
                onChange={(e) => setRondaZone(e.target.value)}
              >
                {["Perímetro Exterior", "Parqueaderos Sótano", "Zona Húmeda / Club House", "Hall Torres"].map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Novedades Encontradas</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Sin novedad..."
                value={rondaNote}
                onChange={(e) => setRondaNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { logEvent({ module: "Minuta", type: "Ronda de Control", unit: "Seguridad", summary: `Ronda en ${rondaZone}. ${rondaNote || "Sin novedad"}`, status: "Cerrado" }); setModalRonda(false); setRondaNote(""); }}>
              Guardar Ronda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cierre Turno */}
      <Dialog open={modalEndShift} onOpenChange={setModalEndShift}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cierre de Turno Formal</DialogTitle>
          </DialogHeader>
          <p className="font-medium text-sm">Resumen del turno:</p>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.visitors}</p>
              <p className="text-xs text-muted-foreground">Visitantes</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.packages}</p>
              <p className="text-xs text-muted-foreground">Paquetes</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.incidents}</p>
              <p className="text-xs text-muted-foreground">Incidentes</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Consignas / Pendientes para el Relevo *</Label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Ej: Queda paquete pendiente..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrega (Yo)</Label>
              <Input readOnly className="bg-muted" defaultValue="Vigilante" />
            </div>
            <div className="space-y-2">
              <Label>Recibe (Relevo) *</Label>
              <Input placeholder="Nombre del compañero" />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setModalEndShift(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { toast.success("Turno cerrado. Sistema bloqueado."); setModalEndShift(false); }}>
              Firmar y Cerrar Minuta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
