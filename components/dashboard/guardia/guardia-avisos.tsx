"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const avisosIniciales = [
  { id: "1", titulo: "Corte de Agua", leido: false, prioridad: "alta" },
  { id: "2", titulo: "Mantenimiento ascensores", leido: false, prioridad: "media" },
];

export default function GuardiaAvisos() {
  const [avisos, setAvisos] = useState(avisosIniciales);

  const marcarEntendido = (id: string, titulo: string) => {
    setAvisos((prev) => prev.map((a) => (a.id === id ? { ...a, leido: true } : a)));
    toast.success(`Aviso "${titulo}" marcado como entendido`);
  };

  const noLeidos = avisos.filter((a) => !a.leido).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avisos</h1>
        <p className="text-muted-foreground text-sm">
          Comunicados del condominio. {noLeidos > 0 && (
            <span className="font-medium text-destructive">{noLeidos} sin leer</span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {avisos.map((aviso) => (
          <Card key={aviso.id} className={aviso.leido ? "opacity-75" : ""}>
            <CardContent className="pt-6">
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 ${
                  aviso.prioridad === "alta" ? "border-destructive" : "border-primary"
                } pl-4`}
              >
                <div>
                  <h3 className="font-semibold">{aviso.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {aviso.leido ? "Marcado como leído" : "Pendiente de confirmar lectura"}
                  </p>
                </div>
                {!aviso.leido && (
                  <Button variant="secondary" onClick={() => marcarEntendido(aviso.id, aviso.titulo)}>
                    Marcar como Entendido
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
