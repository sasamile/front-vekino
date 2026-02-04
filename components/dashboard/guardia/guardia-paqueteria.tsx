"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconPlus } from "@tabler/icons-react";
import toast from "react-hot-toast";

type EstadoPaquete = "Pendiente" | "Entregado";

const paquetesIniciales = [
  { id: "1", empresa: "Amazon", unidad: "T2-202", estado: "Pendiente" as EstadoPaquete },
];

export default function GuardiaPaqueteria() {
  const [paquetes, setPaquetes] = useState(paquetesIniciales);
  const [modalOpen, setModalOpen] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [unidad, setUnidad] = useState("");

  const registrarPaquete = () => {
    if (!empresa.trim() || !unidad.trim()) {
      toast.error("Completa empresa y unidad");
      return;
    }
    setPaquetes((prev) => [
      ...prev,
      { id: String(Date.now()), empresa: empresa.trim(), unidad: unidad.trim(), estado: "Pendiente" },
    ]);
    toast.success("Paquete registrado");
    setEmpresa("");
    setUnidad("");
    setModalOpen(false);
  };

  const entregar = (id: string) => {
    setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado: "Entregado" as EstadoPaquete } : p)));
    toast.success("Paquete marcado como entregado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Control de Paquetería</h1>
          <p className="text-muted-foreground text-sm">Registro y entrega de paquetes.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <IconPlus className="size-4" />
          Registrar Paquete
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Paquete</th>
                  <th className="text-left p-3 text-sm font-medium">Unidad</th>
                  <th className="text-left p-3 text-sm font-medium">Estado</th>
                  <th className="text-left p-3 text-sm font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paquetes.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">{p.empresa} (Caja)</td>
                    <td className="p-3">{p.unidad}</td>
                    <td className="p-3">
                      <Badge variant={p.estado === "Pendiente" ? "secondary" : "default"}>
                        {p.estado}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {p.estado === "Pendiente" && (
                        <Button size="sm" onClick={() => entregar(p.id)}>
                          Entregar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Paquete</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input placeholder="Amazon/Servientrega" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input placeholder="T1-101" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={registrarPaquete}>Guardar y Notificar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
