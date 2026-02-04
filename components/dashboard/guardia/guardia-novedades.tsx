"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function GuardiaNovedades() {
  const [novedad, setNovedad] = useState("");

  const enviarReporte = () => {
    if (!novedad.trim()) {
      toast.error("Describe la novedad");
      return;
    }
    toast.success("Reporte enviado a administración");
    setNovedad("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportar Novedad</h1>
        <p className="text-muted-foreground text-sm">Envía incidentes o novedades al administrador.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descripción de la novedad</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Describe la novedad..."
                value={novedad}
                onChange={(e) => setNovedad(e.target.value)}
                rows={4}
              />
            </div>
            <Button variant="destructive" onClick={enviarReporte}>
              Enviar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
