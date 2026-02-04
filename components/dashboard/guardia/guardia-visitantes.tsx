"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconQrcode } from "@tabler/icons-react";
import toast from "react-hot-toast";

const visitantesIniciales = [
  { id: "1", nombre: "Juan Rodriguez", unidad: "T1-101", enPorteria: true },
];

export default function GuardiaVisitantes() {
  const [visitantes, setVisitantes] = useState(visitantesIniciales);
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [tipo, setTipo] = useState("Visitante");

  const registrarEntrada = () => {
    if (!nombre.trim() || !unidad.trim()) {
      toast.error("Completa nombre y unidad");
      return;
    }
    setVisitantes((prev) => [
      ...prev,
      { id: String(Date.now()), nombre: nombre.trim(), unidad: unidad.trim(), enPorteria: true },
    ]);
    toast.success(`Entrada registrada: ${nombre}`);
    setNombre("");
    setUnidad("");
    setModalOpen(false);
  };

  const registrarSalida = (id: string, nombre: string, unidad: string) => {
    setVisitantes((prev) => prev.filter((v) => v.id !== id));
    toast.success(`Salida registrada: ${nombre}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Control de Acceso</h1>
          <p className="text-muted-foreground text-sm">Registro de visitantes y domiciliarios.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <IconQrcode className="size-4" />
          Registrar Entrada
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Visitante</th>
                  <th className="text-left p-3 text-sm font-medium">Unidad</th>
                  <th className="text-left p-3 text-sm font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {visitantes.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="p-3">{v.nombre}</td>
                    <td className="p-3">{v.unidad}</td>
                    <td className="p-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => registrarSalida(v.id, v.nombre, v.unidad)}
                      >
                        Registrar Salida
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-3 text-sm text-muted-foreground border-t">* Al registrar, se guarda en Minuta.</p>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Visitante</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Nombre</Label>
              <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Unidad</Label>
              <Input placeholder="T1-101" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Tipo</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Visitante">Visitante</option>
                <option value="Domicilio">Domicilio</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={registrarEntrada}>Registrar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
